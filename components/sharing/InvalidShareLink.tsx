export function InvalidShareLink() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="card border-dashed p-8 text-center max-w-sm">
        <p className="item-title">This link is no longer valid</p>
        <p className="text-sm text-muted mt-1">
          The owner may have revoked it, or generated a new one. Ask them to share it with you again.
        </p>
      </div>
    </div>
  );
}
