"use client";

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { Check, Copy } from "lucide-react";

type Props = {
  host: string;
  call_id: string;
};

export default function ShareUrl({ host, call_id }: Props) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  const onCopy = () => {
    if (isCopied) return;
    copyToClipboard(`${host}/${call_id}`);
  };

  return (
    <div className="flex gap-2 my-3 overflow-scroll w-full">
      <pre className="p-2 bg-slate-100 border-slate-200 border rounded-sm w-auto">
        {host}/{call_id}
      </pre>
      <button onClick={onCopy} className="flex items-center justify-center">
        {isCopied ? <Check height={15} /> : <Copy height={15} />}
        <span className="sr-only">Copy Url</span>
      </button>
    </div>
  );
}
