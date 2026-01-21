import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import { useEffect, useState } from "react";

function App() {
  const [dati, setDati] = useState([]);
  useEffect(() => {
    fetch("https://dbarniadigitale-0abe.restdb.io/rest/sensori", {
      headers: {
        "x-apikey": "696f697a3731f7b3333fd7d3",
        "Content-Type": "application/json"
      }
    })
      .then(res => res.json())
      .then(data => setDati(data))
      .catch(err => console.error(err));
  }, []);
  return (
    <div className="mx-auto max-w-7xl p-8 text-center">
      <div className="flex justify-center">
        <a
          href="https://vite.dev"
          target="_blank"
          className="p-6 transition hover:drop-shadow-[0_0_2em_#646cffaa]"
        >
          <img src={viteLogo} alt="Vite logo" className="h-24" />
        </a>

        <a
          href="https://react.dev"
          target="_blank"
          className="p-6 animate-spin-slow transition hover:drop-shadow-[0_0_2em_#61dafbaa]"
        >
          <img src={reactLogo} alt="React logo" className="h-24" />
        </a>
      </div>

      <h1 className="my-6 text-4xl font-bold">Vite + React</h1>

      <div className="p-8">
        <button className="rounded-lg border border-gray-300 px-4 py-2 font-medium transition hover:border-indigo-500 hover:text-indigo-500">
          Ready to go 🚀
        </button>

        <p className="mt-4 text-sm">
          Edit{" "}
          <code className="rounded bg-gray-100 px-1 py-0.5">src/App.jsx</code>{" "}
          and save to test HMR
        </p>
      </div>

      <p className="text-gray-400">
        Click on the Vite and React logos to learn more
      </p>
      <h1>Dati dal database:</h1>
      <div className="p-4">
        {dati.map(sen => (
          <p className="font-bold" key={sen._id}> {sen.sen_modello}
          </p>
        ))}
      </div>
    </div>
  );
}

export default App;
