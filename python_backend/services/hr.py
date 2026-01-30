from services.db import db
import uuid
from datetime import datetime
from decimal import Decimal

class HRService:
    def _to_decimal(self, val):
        if val is None: return Decimal(0)
        return Decimal(str(val))

    def _serialize_row(self, row):
        d = dict(row)
        for k, v in d.items():
            if isinstance(v, Decimal):
                d[k] = float(v)
            elif hasattr(v, 'isoformat'):
                d[k] = v.isoformat()
        return d

    # -----------------------------
    # ATTENDANCE & LEAVE
    # -----------------------------
    async def log_attendance(self, employee_id, date_str, status='PRESENT', check_in=None, check_out=None, ot_mins=0, incentive=0):
        # status: PRESENT, ABSENT, LEAVE, HALF_DAY
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        # Check if exists
        exists = await db.fetch_val("SELECT 1 FROM \"Attendance\" WHERE \"employeeId\" = $1 AND \"date\" = $2", employee_id, target_date)
        
        if exists:
            await db.execute("""
                UPDATE "Attendance" 
                SET "status" = $3, "checkIn" = $4, "checkOut" = $5, "overtimeMinutes" = $6, "incentives" = $7
                WHERE "employeeId" = $1 AND "date" = $2
            """, employee_id, target_date, status, check_in, check_out, ot_mins, self._to_decimal(incentive))
        else:
            await db.execute("""
                INSERT INTO "Attendance" ("id", "employeeId", "date", "status", "checkIn", "checkOut", "overtimeMinutes", "incentives")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """, str(uuid.uuid4()), employee_id, target_date, status, check_in, check_out, ot_mins, self._to_decimal(incentive))
        
        return {"status": "success"}

    async def get_monthly_attendance(self, month, year):
        rows = await db.fetch_rows("""
            SELECT a.*, e."firstName", e."lastName", e."employeeId" as "extId"
            FROM "Attendance" a
            JOIN "Employee" e ON a."employeeId" = e."id"
            WHERE EXTRACT(MONTH FROM a."date") = $1 AND EXTRACT(YEAR FROM a."date") = $2
        """, month, year)
        return [self._serialize_row(r) for r in rows]

    # -----------------------------
    # PAYROLL ENGINE
    # -----------------------------
    async def calculate_payroll(self, employee_id, month, year):
        # 1. Fetch Employee
        emp_rows = await db.fetch_rows("SELECT * FROM \"Employee\" WHERE id = $1", employee_id)
        if not emp_rows: return {"error": "Employee not found"}
        emp = emp_rows[0]
        base_salary = self._to_decimal(emp['salary'])

        # 2. Get Month Attendance Stats
        attendance = await db.fetch_rows("""
            SELECT 
                COUNT(*) FILTER (WHERE status = 'PRESENT') as present_days,
                COUNT(*) FILTER (WHERE status = 'LEAVE') as leave_days,
                SUM("overtimeMinutes") as total_ot,
                SUM("incentives") as total_inc
            FROM "Attendance"
            WHERE "employeeId" = $1 AND EXTRACT(MONTH FROM "date") = $2 AND EXTRACT(YEAR FROM "date") = $3
        """, employee_id, month, year)
        
        stats = attendance[0]
        total_ot_mins = stats['total_ot'] or 0
        total_inc = self._to_decimal(stats['total_inc'])
        
        # Calculate Overtime Pay (Mock: Base/2400 per minute)
        ot_pay = (base_salary / Decimal(2400)) * Decimal(total_ot_mins)
        
        # Statutory Deductions (Mock: PF 12%, ESI 0.75%)
        pf_amount = base_salary * Decimal('0.12')
        esi_amount = base_salary * Decimal('0.0075')
        
        net_amount = base_salary + total_inc + ot_pay - pf_amount - esi_amount
        
        payroll_id = str(uuid.uuid4())
        await db.execute("""
            INSERT INTO "Payroll" (id, "employeeId", month, year, "baseSalary", incentives, "overtimeSalary", "pfAmount", "esiAmount", "netAmount")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT ("employeeId", month, year) DO UPDATE 
            SET "baseSalary" = $5, "incentives" = $6, "overtimeSalary" = $7, "pfAmount" = $8, "esiAmount" = $9, "netAmount" = $10
        """, payroll_id, employee_id, month, year, base_salary, total_inc, ot_pay, pf_amount, esi_amount, net_amount)
        
        return {"payrollId": payroll_id, "netAmount": float(net_amount)}

    async def get_salary_slip(self, employee_id, month, year):
        payroll = await db.fetch_rows("""
            SELECT p.*, e."firstName", e."lastName", e."employeeId" as "extId", e.designation, 
                   e."pfNumber", e."esiNumber", e."panNumber", e."bankAccountNumber"
            FROM "Payroll" p
            JOIN "Employee" e ON p."employeeId" = e.id
            WHERE p."employeeId" = $1 AND p.month = $2 AND p.year = $3
        """, employee_id, month, year)
        
        if not payroll: return {"error": "Payroll not processed for this period"}
        return self._serialize_row(payroll[0])

    # -----------------------------
    # REPORTS
    # -----------------------------
    async def get_yearly_pf_report(self, year):
        rows = await db.fetch_rows("""
            SELECT e."firstName", e."lastName", e."employeeId" as "extId", SUM(p."pfAmount") as "totalPF"
            FROM "Payroll" p
            JOIN "Employee" e ON p."employeeId" = e.id
            WHERE p.year = $1
            GROUP BY e.id, e."firstName", e."lastName", e."employeeId"
        """, year)
        return [self._serialize_row(r) for r in rows]

    async def get_yearly_salary_report(self, year):
        rows = await db.fetch_rows("""
            SELECT e."firstName", e."lastName", e."employeeId" as "extId", 
                   SUM(p."baseSalary") as "totalBase", SUM(p.incentives) as "totalInc", 
                   SUM(p."netAmount") as "totalNet"
            FROM "Payroll" p
            JOIN "Employee" e ON p."employeeId" = e.id
            WHERE p.year = $1
            GROUP BY e.id, e."firstName", e."lastName", e."employeeId"
        """, year)
        return [self._serialize_row(r) for r in rows]

hr_service = HRService()
