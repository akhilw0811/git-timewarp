import { useState, useEffect } from "react";
import axios from "axios";

interface Commit {
  id: string;
  timestamp: number;
  message: string;
}

interface FileSnapshot {
  path: string;
  churn: number;
  hotspot_score: number;
}

interface Directory {
  name: string;
  files: FileSnapshot[];
}

export function useSnapshots(apiBase: string = "http://127.0.0.1:8000") {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [files, setFiles] = useState<FileSnapshot[]>([]);
  const [dirs, setDirs] = useState<Directory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch timeline on mount
  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${apiBase}/timeline`);
        setCommits(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch timeline");
        console.error("Error fetching timeline:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [apiBase]);

  // Fetch snapshot when currentIndex changes
  useEffect(() => {
    const fetchSnapshot = async () => {
      if (commits.length === 0 || currentIndex >= commits.length) {
        return;
      }

      try {
        setLoading(true);
        const commitId = commits[currentIndex].id;
        const response = await axios.get(`${apiBase}/snapshot/${commitId}`);
        const snapshotFiles = response.data;

        setFiles(snapshotFiles);

        // Group files by directory
        const directoryMap = new Map<string, FileSnapshot[]>();

        snapshotFiles.forEach((file: FileSnapshot) => {
          const pathParts = file.path.split("/");
          const dirName = pathParts.length > 1 ? pathParts[0] : "root";

          if (!directoryMap.has(dirName)) {
            directoryMap.set(dirName, []);
          }
          directoryMap.get(dirName)!.push(file);
        });

        const directories: Directory[] = Array.from(directoryMap.entries()).map(
          ([name, files]) => ({
            name,
            files,
          }),
        );

        setDirs(directories);
        setError(null);
      } catch (err) {
        setError("Failed to fetch snapshot");
        console.error("Error fetching snapshot:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();
  }, [currentIndex, commits, apiBase]);

  return {
    commits,
    currentIndex,
    setCurrentIndex,
    files,
    dirs,
    loading,
    error,
  };
}
