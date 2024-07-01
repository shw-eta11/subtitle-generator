"use client";

import AudioSubmit from "@/components/audio-submit";
import Waveform from "@/components/waveform";
import { File, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export default function TryIt() {
  const [file, setFile] = useState<File | undefined>();
  const [audioFile, setAudioFile] = useState<File | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ffmpeg, setFFmpeg] = useState<FFmpeg | null>(null);

  useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [file]);

  useEffect(() => {
    const loadFFmpeg = async () => {
      const ffmpegInstance = new FFmpeg();
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd";
      await ffmpegInstance.load({
        coreURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.js`,
          "text/javascript"
        ),
        wasmURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          "application/wasm"
        ),
      });
      setFFmpeg(ffmpegInstance);
    };
    loadFFmpeg();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith("video/")) {
        const extractedAudio = await extractAudio(selectedFile);
        setAudioFile(extractedAudio);
      } else if (selectedFile.type.startsWith("audio/")) {
        setAudioFile(selectedFile);
      }
    }
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };
  const createFile = (
    bits: BlobPart[],
    name: string,
    options?: FilePropertyBag
  ): File => {
    return new window.File(bits, name, options);
  };
  const extractAudio = async (video: File): Promise<File | undefined> => {
    if (!ffmpeg) {
      console.error("FFmpeg is not loaded yet");
      return;
    }

    try {
      const inputExtension =
        video.name.split(".").pop()?.toLowerCase() || "mp4";
      const inputFileName = `input.${inputExtension}`;

      await ffmpeg.writeFile(inputFileName, await fetchFile(video));
      await ffmpeg.exec([
        "-i",
        inputFileName,
        "-vn",
        "-acodec",
        "libmp3lame",
        "output.mp3",
      ]);
      const data = await ffmpeg.readFile("output.mp3");
      const audioBlob = new Blob([data], { type: "audio/mp3" });
      const audioFile = createFile([audioBlob], "extracted_audio.mp3", {
        type: "audio/mp3",
      });

      return audioFile;
    } catch (error) {
      console.error("Error extracting audio:", error);
    }
  };

  return (
    <div className="container flex w-full flex-col items-center gap-12">
      <section className="text-center py-28 max-w-3xl flex flex-col gap-3 items-center w-full">
        <div className="text-5xl tracking-tighter font-semibold">
          Upload an audio or video file
        </div>

        <div className="w-full">
          {file && (
            <div
              className="flex flex-col items-center w-full gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <h1 className="pt-12 font-semibold w-full">
                <Waveform file={file} />
              </h1>
              {audioFile && <AudioSubmit file={audioFile} setFile={setFile} />}
            </div>
          )}
          <div
            onClick={handleUploadClick}
            className="my-5 flex gap-2 items-center px-2.5 py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-600 bg-gray-100 bg-opacity-40 cursor-pointer justify-center"
          >
            {!file ? (
              <>
                <Upload size={20} /> Select a File
              </>
            ) : (
              <>
                <File size={20} /> Change File
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*,video/x-matroska,.mkv"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      </section>
    </div>
  );
}
