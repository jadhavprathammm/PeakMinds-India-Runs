export default function WorkspaceHeader() {
  return (
    <div className="text-center mx-auto">
      {/* Title: ~15% smaller than the 80px section scale */}
      <h2 className="text-4xl sm:text-5xl lg:text-[68px] font-bold tracking-[-0.03em] leading-[1.05] text-foreground text-balance">
        Candidate Intelligence Results
      </h2>

      <p className="mx-auto mt-6 max-w-[720px] text-[19px] leading-[1.7] text-foreground/75">
        Search, compare, and understand exactly why every recommendation
        ranked where it did.
      </p>
    </div>
  );
}
