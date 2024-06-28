"use client";

import { useEffect, useState } from "react";
import ReqProgress from "./reqProgress";
import ReqFail from "./reqFail";
import Loading from "./loading";
import DataViewer from "@/components/data-viewer";

export default function Page({ params }: { params: { call_id: string } }) {
  const [data, setData] = useState<any | undefined>();
  const [status, setStatus] = useState<number>();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const formData = new FormData();
    formData.append("call_id", params.call_id);
    console.log(params.call_id);
    const fetchData = async () => {
      fetch(
        `https://rohit4242-transcripter--transcript-generator-entrypoint.modal.run/call_id`,
        {
          method: "POST",
          body: formData,
        }
      )
        .then((response) => {
          setStatus(response.status);
          if (response.status == 202) {
            timeoutId = setTimeout(fetchData, 10000);
          } else {
            return response.json();
          }
        })
        .then((data) => {
          setData(data);
        })
        .catch((error) => {
          setStatus(500);
        });
    };

    fetchData();

    return () => clearTimeout(timeoutId);
  }, []);

  if (status == 202) {
    return <ReqProgress />;
  }

  if (status == 500) {
    return <ReqFail />;
  }

  if (!data) {
    return <Loading />;
  }

  if (data) {
    return (
      <>
        <div className="container flex flex-col items-center gap-4 max-w-3xl">
          <DataViewer data={data} />
        </div>
      </>
    );
  }
}
