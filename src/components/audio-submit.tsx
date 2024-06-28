import { useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import ShareUrl from "./share-url";
import Link from "next/link";
import { Button, buttonVariants } from "./ui/button";
import { toast } from "sonner";

type Props = {
  setFile: React.Dispatch<React.SetStateAction<File | undefined>>;
  file: File;
};

export default function AudioSubmit({ setFile, file }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [open, setOpen] = useState(false);
  const [call_id, setCall_id] = useState("");

  async function submitAudio() {
    const reader = new FileReader();
    reader.onload = async (event: any) => {
      if (event.target && event.target.result) {
        const base64Audio = event.target.result.split(',')[1];
        console.log(base64Audio,file.name)
        const promise = () =>
          axios.post(
            `https://rohit4242-transcripter--transcript-generator-entrypoint.modal.run/transcribe`,
            { audio: base64Audio, filename: file.name },
            { headers: { 'Content-Type': 'application/json' } }
          );

        toast.promise(promise, {
          loading: "Sending your file to the server",
          success: (response:any) => {
            setOpen(true);
            setCall_id(response.data.call_id);
            return "Received call id: " + response.data.call_id;
          },
          error: "Failed to send file",
        });
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Successfully Sent File!</DialogTitle>
            <DialogDescription>
              The transcription will be available at this link. You can go there
              right now or check back later.
            </DialogDescription>
          </DialogHeader>
          <ShareUrl host={window.location.href} call_id={call_id} />
          <DialogFooter className="sm:justify-start">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/tryit/${call_id}`}
                className={buttonVariants()}
              >
                Go to the Link
              </Link>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setFile(undefined);
                  setOpen(false);
                  setSubmitted(false);
                  setCall_id("");
                }}
              >
                Upload A New File
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        onClick={() => {
          setSubmitted(true);
          submitAudio();
        }}
      >
        {submitted ? "Sending..." : "Send It!"}
      </Button>
    </>
  );
}