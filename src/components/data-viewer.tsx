"use client";

import { Check, Copy, Download } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useState } from "react";

type Props = {
  data: any;
};

export default function DataViewer({ data }: Props) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });
  const [activeTab, setActiveTab] = useState("timestamps");

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millisecs = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")},${millisecs
      .toString()
      .padStart(3, "0")}`;
  };

  const createSRTContent = (chunks: any[]) => {
    return chunks
      .map((chunk, index) => {
        const start = formatTime(chunk.timestamp[0]);
        const end = formatTime(chunk.timestamp[1]);
        return `${index + 1}\n${start} --> ${end}\n${chunk.text}\n\n`;
      })
      .join("");
  };

  const handleDownload = () => {
    let content = "";
    let filename = "";
    let type = "";

    switch (activeTab) {
      case "text":
        content = data.transcription?.text || "";
        filename = "transcription.txt";
        type = "text/plain";
        break;
      case "timestamps":
        content = createSRTContent(data.transcription.chunks);
        filename = "subtitles.srt";
        type = "text/plain";
        break;
      case "json":
        content = JSON.stringify(data.json_output.chunks, null, 2);
        filename = "transcription.json";
        type = "application/json";
        break;
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    let content = "";
    switch (activeTab) {
      case "text":
        content = data.transcription?.text || "";
        break;
      case "timestamps":
        content = createSRTContent(data.transcription.chunks);
        break;
      case "json":
        content = JSON.stringify(data.json_output.chunks, null, 2);
        break;
    }
    copyToClipboard(content);
  };

  return (
    <section className="flex flex-col gap-3 items-center w-full h-auto max-h-[85vh] overflow-scroll">
      <Tabs
        defaultValue="timestamps"
        className="w-full h-full"
        onValueChange={(value) => setActiveTab(value)}
      >
        <div className="w-full justify-between flex items-center">
          <TabsList>
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="timestamps">Subtitles</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
          <div className="bg-slate-100/90  mx-4 rounded-md border-none text-gray-600">
            <div className="flex items-center p-1">
              <button
                className="hover:bg-white rounded-md px-1"
                onClick={handleDownload}
              >
                <Download className="size-9 py-2" />
                <span className="sr-only">Download</span>
              </button>
              <button
                className="hover:bg-white rounded-md px-1"
                onClick={handleCopy}
              >
                {isCopied ? (
                  <Check className="size-9 py-2" />
                ) : (
                  <Copy className="size-9 py-2" />
                )}
                <span className="sr-only">Copy Content</span>
              </button>
            </div>
          </div>
        </div>
        <TabsContent
          className="bg-gray-100 px-5 py-3 rounded-lg border-gray-300 border text-gray-600 font-mono h-fit "
          value="text"
        >
          {data.transcription?.text}
        </TabsContent>
        <TabsContent
          className="bg-gray-100 px-5 py-3 rounded-lg border-gray-300 border text-gray-600 font-mono h-fit"
          value="timestamps"
        >
          {data.transcription.chunks.map((chunk: any, index: number) => (
            <div className="border-b py-3" key={index}>
              <p>{chunk.text}</p>
              <p className="text-sm opacity-70">
                {formatTime(chunk.timestamp[0])} --{" "}
                {formatTime(chunk.timestamp[1])}
              </p>
            </div>
          ))}
        </TabsContent>
        <TabsContent
          className="bg-gray-100 px-5 py-3 rounded-lg border-gray-300 border text-gray-600 font-mono h-fit max-h[90%] overflow-scroll"
          value="json"
        >
          <pre>{JSON.stringify(data.json_output.chunks, null, 2)}</pre>
        </TabsContent>
      </Tabs>
    </section>
  );
}
