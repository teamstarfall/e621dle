import Image from "next/image";

function randomNumber() {
  return Math.floor(Math.random() * 10000);
}
function generateButton(name: string) {
  return (
    <span className="flex flex-col gap-[12px] w-full h-full border-2 hover:bg-gray-800">
      {name}
      <div className="flex flex-col mb-[0px]">
        <span className="text-[42px] font-bold">{randomNumber()}</span>
        <span>posts</span>
      </div>
    </span>
  )
}
export default function Home() {
  return (
    <div id="container" className="font-sans items-center justify-items-center min-h-screen h-full max-w-[1200px] mx-auto w-screen p-8 pb-20 gap-4 ">
      <header className="flex flex-col gap-[16px] justify-center text-center border-3 rounded-xl p-[16px] w-full mb-[20px]">
        <h2>Angel's Epic Game</h2>
        <span className="flex flex-row justify-center gap-[12px]">
          <span className="p-2 border-1 rounded-xl">Current Streak: 0</span>
          <span className="p-2 border-1 rounded-xl">Best Streak: 0</span>
        </span>
      </header>
      <main className="flex flex-col flex-grow text-center justify-center gap-[12px] h-full w-full row-start-2 items-center sm:items-start border-1 rounded-xl">
        <div className="w-full">
          Which one has the most posts?
        </div>
        <div className="flex flex-row gap-[16px] h-full w-full row-start-2 items-center sm:items-start border-1 rounded-xl">
          {generateButton("pic 1")}
          <span className="flex-shrink">
            or
          </span>
          {generateButton("pic 2")}
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        Created by Team Starfall
      </footer>
    </div>
  );
}
