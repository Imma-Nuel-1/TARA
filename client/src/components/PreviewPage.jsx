import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { apiGet } from "../services/apiClient";

const PreviewPage = () => {
  const { previewId = "" } = useParams();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["preview", previewId],
    queryFn: () => apiGet(`/api/public/preview/${previewId}`),
    enabled: Boolean(previewId),
  });

  if (isLoading)
    return (
      <main className="preview-page">
        <div className="preview-card">
          <div className="preview-loading">Loading preview...</div>
        </div>
      </main>
    );

  if (isError)
    return (
      <main className="preview-page">
        <div className="preview-card error">
          <div className="preview-error-icon">⚠️</div>
          <h2>Preview Not Available</h2>
          <p>{error.message}</p>
        </div>
      </main>
    );

  return (
    <main className="preview-page">
      <div className="preview-card">
        <div className="preview-header">
          <span
            className={`preview-badge ${data?.status || "pending"}`}
          >
            {data?.status || "pending"}
          </span>
          <span className={`preview-type-badge ${data?.type || "unknown"}`}>
            {data?.type || "unknown"}
          </span>
        </div>

        <h1 className="preview-title">{data?.title || "Untitled"}</h1>

        <div className="preview-content">
          {data?.type === "message" && (
            <div className="preview-message">
              <p>
                {typeof data.data === "string"
                  ? data.data
                  : JSON.stringify(data.data, null, 2)}
              </p>
            </div>
          )}

          {data?.type === "image" && data?.data?.url && (
            <div className="preview-image">
              <img src={data.data.url} alt={data?.title || "Preview"} />
              {data?.data?.caption && (
                <p className="preview-image-caption">{data.data.caption}</p>
              )}
            </div>
          )}

          {data?.type !== "message" && data?.type !== "image" && (
            <pre className="preview-payload">
              {JSON.stringify(data?.data, null, 2)}
            </pre>
          )}
        </div>

        {data?.createdBy && (
          <div className="preview-meta">
            <strong>Submitted by:</strong> {data.createdBy}
          </div>
        )}

        {data?.createdAt && (
          <div className="preview-meta">
            <strong>Submitted on:</strong>{" "}
            {new Date(data.createdAt).toLocaleString()}
          </div>
        )}
      </div>
    </main>
  );
};

export default PreviewPage;
