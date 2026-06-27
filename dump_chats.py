import sqlite3
import os
import glob
import json

db_dir = r"C:\Users\Harsh\.gemini\antigravity\conversations"
databases = glob.glob(os.path.join(db_dir, "*.db"))

output_file = r"C:\Users\Harsh\.gemini\antigravity\scratch\biomed-explorer\found_tables.md"

def search_value(val):
    """Recursively search for markdown table characters in json values."""
    if isinstance(val, str):
        if "|" in val and "---" in val:
            return val
    elif isinstance(val, dict):
        for k, v in val.items():
            res = search_value(v)
            if res:
                return res
    elif isinstance(val, list):
        for item in val:
            res = search_value(item)
            if res:
                return res
    return None

with open(output_file, "w", encoding="utf-8") as out:
    out.write("# Found Tables from Previous Conversations\n\n")

    for db_path in databases:
        db_name = os.path.basename(db_path)
        if "1ef3ae75-dd63-43a2-9cbe-254e5c60d97f" in db_name:
            continue
            
        out.write(f"## Database: {db_name}\n\n")
        
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Query steps table
            cursor.execute("SELECT idx, step_payload FROM steps ORDER BY idx DESC;")
            rows = cursor.fetchall()
            
            table_found = False
            for idx, payload in rows:
                if not payload:
                    continue
                    
                # Payload can be string or bytes
                payload_str = ""
                if isinstance(payload, bytes):
                    try:
                        payload_str = payload.decode("utf-8", errors="ignore")
                    except:
                        pass
                else:
                    payload_str = str(payload)
                    
                # Try to parse as JSON
                try:
                    data = json.loads(payload_str)
                    found = search_value(data)
                    if found:
                        out.write(f"### Found Table in Step {idx}:\n\n")
                        out.write(found)
                        out.write("\n\n" + "="*50 + "\n\n")
                        table_found = True
                        break
                except Exception as e:
                    if "|" in payload_str and "---" in payload_str:
                        out.write(f"### Found Raw Table in Step {idx}:\n\n")
                        out.write(payload_str)
                        out.write("\n\n" + "="*50 + "\n\n")
                        table_found = True
                        break
                        
            if not table_found:
                out.write("No markdown tables found.\n\n")
                
            conn.close()
        except Exception as e:
            out.write(f"Error reading database {db_name}: {e}\n\n")

print(f"Extraction complete! Results written to: {output_file}")
