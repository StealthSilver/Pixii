/** Matches landing + hooks dashboard background layers. */
export function GridBackdrop() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 bg-[length:26px_26px] opacity-[0.38] dark:hidden"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgb(0 0 0 / 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(0 0 0 / 0.04) 1px, transparent 1px)
          `,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 hidden bg-[length:26px_26px] opacity-[0.42] dark:block"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgb(255 255 255 / 0.045) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(255 255 255 / 0.045) 1px, transparent 1px)
          `,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-18%,rgb(191_79_48_/_0.07),transparent_58%)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_-18%,rgb(224_122_85_/_0.09),transparent_58%)]"
        aria-hidden
      />
    </>
  );
}
