import os

log_path = 'diag_out.log'
if os.path.exists(log_path):
    with open(log_path, 'rb') as f:
        content = f.read()
    
    # Try decoding
    for enc in ['utf-16le', 'utf-16', 'utf-8']:
        try:
            text = content.decode(enc)
            print(f"--- Decoded with {enc} ---")
            print(text)
            break
        except:
            continue
else:
    print("Log file not found")
