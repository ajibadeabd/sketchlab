import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { Chess } from "chess.js";
import Stockfish from "stockfish";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const generateExplanation = async (san, evalScore) => {
  // simple local explanation based on evalScore
  if (evalScore < -0.5) return `Blunder with ${san}`;
  if (evalScore < -0.2) return `Inaccuracy with ${san}`;
  return `Good move ${san}`;
};

const evaluateMoveWithBest = async (fen) => {
  return new Promise((resolve) => {
    const engine = Stockfish();
    let evalScore = null;
    let bestMove = null;

    engine.onmessage = (event) => {
      const line = event.data || event;

      if (line.includes("score cp")) {
        const match = line.match(/score cp (-?\d+)/);
        if (match) evalScore = parseInt(match[1], 10) / 100;
      }

      if (line.includes("bestmove")) {
        const match = line.match(/bestmove (\w+)/);
        if (match) bestMove = match[1];
        engine.postMessage("quit");
        resolve({ evalScore, bestMove });
      }
    };

    engine.postMessage("uci");
    engine.postMessage("ucinewgame");
    engine.postMessage(`position fen ${fen}`);
    engine.postMessage("go depth 12");
  });
};

app.post("/analyze", async (req, res) => {
  try {
    const { pgn } = req.body;
    if (!pgn) return res.status(400).json({ error: "PGN is required" });

    const chess = new Chess();
    chess.load_pgn(pgn);
    const moves = chess.history({ verbose: true });

    const analysis = [];
    const tempChess = new Chess();

    for (const move of moves) {
      tempChess.move(move);
      const fen = tempChess.fen();

      // evaluate this move with Stockfish
      const { evalScore, bestMove } = await evaluateMoveWithBest(fen);
      const explanation = await generateExplanation(move.san, evalScore);

      analysis.push({
        move: move.san,
        evalScore,
        bestMove,
        explanation,
      });
    }

    res.json({ analysis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analysis failed" });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
