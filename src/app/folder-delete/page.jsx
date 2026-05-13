"use client";
import { useEffect } from "react";

export default function DeleteAPIFolderPage() {
  useEffect(() => {
    fetch("/api/api-folder");
  }, []);

  return (
    <div className="p-5">
      <h2>Deleting API Folder...</h2>
    </div>
  );
}