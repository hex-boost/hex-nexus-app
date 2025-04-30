// Creating the empty state component since it's not defined in the provided code
export function SummonerCardEmptyState() {
  return (
    <div
      className="relative max-w-xs aspect-[3/4] bg-card overflow-hidden rounded-xl flex flex-col items-center justify-center p-4"
    >
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-card from-40% to-transparent" />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="text-5xl mb-4 text-muted-foreground">?</div>
        <p className="font-medium">No Summoner</p>
        <p className="text-sm text-muted-foreground mt-1">
          Waiting for summoner...
        </p>
      </div>
    </div>
  );
}
export function SummonerCardNotLoggedIn() {
  return (
    <div
      className="relative max-w-xs aspect-[3/4] bg-card overflow-hidden rounded-xl flex flex-col items-center justify-center p-4"
    >
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-card from-40% to-transparent" />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="text-5xl mb-4 text-muted-foreground">?</div>
        <p className="font-medium">Waiting For Login</p>
        <p className="text-sm text-muted-foreground mt-1">
          Your summoner will be displayed here
        </p>
      </div>
    </div>
  );
}
