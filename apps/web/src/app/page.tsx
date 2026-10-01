export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6">
      <p className="text-sm font-medium text-muted-foreground">Cocktail Taste Test</p>
      <h1 className="text-4xl font-semibold tracking-tight">나에게 맞는 칵테일을 찾아보세요.</h1>
      <p className="text-lg text-muted-foreground">칵테일 지식 없이도 시작할 수 있는 취향 테스트입니다.</p>
      <a className="w-fit rounded-md bg-foreground px-4 py-2 text-background" href="#start">테스트 시작하기</a>
    </main>
  );
}
