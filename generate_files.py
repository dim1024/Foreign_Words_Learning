import os
import json

START_DIR = "data"  # имя стартовой папки

def scan_folder(folder):
    items = []
    for entry in os.listdir(folder):
        # пропускаем скрытые файлы и папки
        if entry.startswith('.'):
            continue

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
                name_without_ext = os.path.splitext(entry)[0]
                items.append({
                    "name": name_without_ext,
                    "type": "file",
                    "path": os.path.relpath(path, START_DIR)
                })
    return items

tree = scan_folder(START_DIR)

with open("files.json", "w", encoding="utf-8") as f:
    json.dump(tree, f, ensure_ascii=False, indent=2)

print("files.json generated successfully!")
