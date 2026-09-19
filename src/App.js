import './styles.css';
import { useEffect, useState } from 'react';

const SECRET_WORD_BACKUPS = ['SPEND', 'WORTH', 'STORM', 'HAPPY'];
const MAX_GUESSES = 5;
const WORD_LENGTH = 5;

const computeLetters = (word, secret) => {
  let results = [];
  let secretUsed = Array.from({ length: WORD_LENGTH }, () => false);

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (word[i] === secret[i]) {
      results[i] = 'green';
      secretUsed[i] = true;
    }
  }

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (results[i] === 'green') continue;

    let foundMatch = false;

    for (let j = 0; j < secretUsed.length; j++) {
      if (secret[j] === word[i] && !secretUsed[j]) {
        secretUsed[j] = true;
        foundMatch = true;
        break;
      }
    }

    results[i] = foundMatch ? 'yellow' : 'grey';
  }

  return results;
};

function WordRow({ guess }) {
  const word = guess?.word ?? '';
  const result = guess?.result ?? [];

  const letters = Array.from(
    { length: WORD_LENGTH },
    (_, index) => word[index] ?? '',
  );

  return (
    <div className="word-row">
      {letters.map((letter, index) => (
        <span style={{ background: result[index] ?? 'white' }} key={index}>
          {letter}
        </span>
      ))}
    </div>
  );
}

function App() {
  const [currentWord, setCurrentWord] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [gameResult, setGameResult] = useState('');
  const [secretWord, setSecretWord] = useState('');

  useEffect(() => {
    const getSecretWord = async () => {
      try {
        const url = `https://random-word-api.herokuapp.com/word?length=${WORD_LENGTH}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        const word = data[0];

        if (word?.length !== WORD_LENGTH) {
          throw new Error(`API returned invalid word.`);
        }

        setSecretWord(word.toLowerCase());
      } catch {
        const randomIndex = Math.floor(
          Math.random() * SECRET_WORD_BACKUPS.length,
        );
        setSecretWord(randomIndex.toLowerCase());
      }
    };

    getSecretWord();
  }, []);

  const guessWord = () => {
    const trimmedWord = currentWord.trim().toLowerCase();

    if (trimmedWord.length !== WORD_LENGTH) {
      setErrorMessage('Word must be 5 letters long');
      return;
    }

    const isAlreadyGuessedWord = guesses.some(
      (guess) => guess.word.toLowerCase() === trimmedWord,
    );

    if (isAlreadyGuessedWord) {
      setErrorMessage('Word already guessed! Try another word.');
      return;
    }

    setErrorMessage('');
    setCurrentWord('');

    setGuesses((previousGuesses) => [
      ...previousGuesses,
      { word: trimmedWord, result: computeLetters(trimmedWord, secretWord) },
    ]);

    if (trimmedWord === secretWord) {
      setGameResult('won');
    } else if (guesses.length + 1 === MAX_GUESSES) {
      setGameResult('lost');
    }
  };

  return (
    <div className="page-container">
      <div className="word-board">
        {Array.from({ length: MAX_GUESSES }, (_, index) => (
          <WordRow key={index} guess={guesses[index] ?? ''} />
        ))}
      </div>
      <div style={{ height: 50, textAlign: 'center' }}>
        <span style={{ color: 'green' }}>
          {gameResult === 'won' && 'You win the game!'}
        </span>
        <span style={{ color: 'red' }}>
          {gameResult === 'lost' && (
            <>
              You lost, try again next time.
              <br />
              Secret word '{secretWord.toUpperCase()}'.
            </>
          )}
        </span>
      </div>
      <div className="controls">
        <input
          title="Input your word"
          placeholder="Type in a 5 letter word..."
          id="word-input"
          type="text"
          value={currentWord}
          onChange={(event) => setCurrentWord(event.target.value)}
        ></input>
        <button
          type="button"
          title="Guess Word"
          disabled={gameResult !== '' || guesses.length >= MAX_GUESSES}
          onClick={() => {
            guessWord();
          }}
        >
          Guess Word
        </button>
        <p className="error-message">{errorMessage}</p>
      </div>
    </div>
  );
}

export default App;
