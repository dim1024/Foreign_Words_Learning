import os
import json

START_DIR = "data"  # имя стартовой папки

def scan_folder(folder):
    items = []
    for entry in os.listdir(folder):
        path = os.path.join(folder, entry)
        if os.path.isdir(path):
            items.append({
                "name": entry,
                "type": "folder",
                "children": scan_folder(path)
            })
        else:
            # фильтруем только нужные файлы
            if entry.endswith((".txt", ".csv", ".xlsx")):
                items.append({
                    "name": entry,
                    "type": "file",
                    "path": os.path.relpath(path, START_DIR)
                })
    return items

tree = scan_folder(START_DIR)

with open("files.json", "w", encoding="utf-8") as f:
    json.dump(tree, f, ensure_ascii=False, indent=2)

print("files.json generated successfully!")
