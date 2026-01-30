
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

class Database:
    def __init__(self):
        self.pool = None

    async def connect(self):
        if not self.pool:
            try:
                self.pool = await asyncpg.create_pool(DATABASE_URL)
                print("Database connected.")
            except Exception as e:
                print(f"Database connection failed: {e}")
                raise e

    async def disconnect(self):
        if self.pool:
            await self.pool.close()
            print("Database disconnected.")

    async def fetch_rows(self, query: str, *args):
        if not self.pool:
            await self.connect()
        async with self.pool.acquire() as connection:
            return await connection.fetch(query, *args)

    async def fetch_val(self, query: str, *args):
        if not self.pool:
            await self.connect()
        async with self.pool.acquire() as connection:
            return await connection.fetchval(query, *args)

    async def execute(self, query: str, *args):
        if not self.pool:
            await self.connect()
        async with self.pool.acquire() as connection:
            return await connection.execute(query, *args)

db = Database()
