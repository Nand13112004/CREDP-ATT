"""
Utility script to export the entire Attendance App into a clean, portable zip file
excluding bulky folders like node_modules, .expo, .git, and cache directories.
"""

import os
import zipfile

def export_project():
    project_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(project_dir)
    zip_path = os.path.join(parent_dir, "attendance-app-export.zip")

    exclude_dirs = {"node_modules", ".expo", ".git", "__pycache__"}
    exclude_extensions = {".log"}

    print(f"Creating export from: {project_dir}")
    print(f"Destination archive:  {zip_path}")

    file_count = 0
    total_bytes = 0

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(project_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for f in files:
                if any(f.endswith(ext) for ext in exclude_extensions):
                    continue
                if f == "attendance-app-export.zip":
                    continue
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, project_dir)
                arcname = os.path.join("attendance-app", rel_path)
                zipf.write(full_path, arcname)
                file_count += 1
                total_bytes += os.path.getsize(full_path)

    zip_size = os.path.getsize(zip_path)
    print(f"\nDone! Exported {file_count} files ({total_bytes} bytes uncompressed).")
    print(f"Zip Archive Size: {zip_size / 1024:.1f} KB")
    print(f"Location: {zip_path}")

if __name__ == "__main__":
    export_project()
