type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
};

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <header className="mt-2 mb-5">
      <h1 className="font-serif text-3xl leading-tight font-semibold tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-text-dim mt-1 font-sans text-xs tracking-[0.12em] uppercase">
          {subtitle}
        </p>
      )}
    </header>
  );
}
