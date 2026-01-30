import os

log_path = 'python_backend/server_out.log'
if os.path.exists(log_path):
    with open(log_path, 'rb') as f:
        content = f.read()
    
    # Try decoding
    for enc in ['utf-16le', 'utf-16', 'utf-8']:
        try:
            text = content.decode(enc)
            print(f"--- Decoded with {enc} ---")
            # Print last 5000 characters
            print(text[-5000:])
            break
        except:
            continue
else:
    print("Log file not found")
