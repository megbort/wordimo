import './styles.css';
import { useEffect, useState } from 'react';

const SECRET_WORD_BACKUPS = {
  short: ['SEAT', 'JUNK', 'MIND', 'WIND'],
  medium: ['SPEND', 'WORTH', 'STORM', 'HAPPY'],
  long: ['SPREAD', 'BRIDGE', 'LOCKED', 'MISSED'],
};

const GAME_SETTING = { short: 4, medium: 5, long: 6 };
const MAX_GUESSES = 5;

const computeLetters = (word, secret, setting) => {
  let results = [];
  let secretUsed = Array.from({ length: setting }, () => false);

  for (let i = 0; i < setting; i++) {
    if (word[i] === secret[i]) {
      results[i] = 'green';
      secretUsed[i] = true;
    }
  }

  for (let i = 0; i < setting; i++) {
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

function WordSettings({ setting, onSettingChange, onNewGame }) {
  return (
    <div>
      <fieldset>
        <div>
          <input
            id="short"
            type="radio"
            name="setting"
            value="short"
            checked={setting === 'short'}
            onChange={onSettingChange}
          ></input>
          <label htmlFor="short">Short (4)</label>
        </div>
        <div>
          <input
            id="medium"
            type="radio"
            name="setting"
            value="medium"
            checked={setting === 'medium'}
            onChange={onSettingChange}
          ></input>
          <label htmlFor="medium">Medium (5)</label>
        </div>
        <div>
          <input
            id="long"
            type="radio"
            name="setting"
            value="long"
            checked={setting === 'long'}
            onChange={onSettingChange}
          ></input>
          <label htmlFor="long">Long (6)</label>
        </div>
      </fieldset>
      <button onClick={onNewGame}>New Game</button>
    </div>
  );
}

function WordRow({ guess, setting }) {
  const word = guess?.word ?? '';
  const result = guess?.result ?? [];

  const letters = Array.from(
    { length: GAME_SETTING[setting] },
    (_, index) => word[index] ?? '',
  );

  return (
    <div className={`word-row ${setting}`}>
      {letters.map((letter, index) => (
        <span style={{ background: result[index] ?? 'white' }} key={index}>
          {letter}
        </span>
      ))}
    </div>
  );
}

function App() {
  const [gameId, setGameId] = useState(0);
  const [currentWord, setCurrentWord] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [gameResult, setGameResult] = useState('');
  const [secretWord, setSecretWord] = useState('');
  const [wordSetting, setWordSetting] = useState('medium');
  const [selectedLevel, setSelectedLevel] = useState('medium');
  const [definition, setDefinition] = useState(null);

  useEffect(() => {
    const getSecretWord = async () => {
      const length = GAME_SETTING[wordSetting];

      try {
        const url = `https://random-word-api.herokuapp.com/word?length=${length}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        const word = data[0];

        if (word?.length !== length) {
          throw new Error(`API returned invalid word.`);
        }

        setSecretWord(word.toLowerCase());
      } catch {
        const backUpWords = SECRET_WORD_BACKUPS[wordSetting];
        const randomIndex = Math.floor(Math.random() * backUpWords.length);
        setSecretWord(backUpWords[randomIndex].toLowerCase());
      }
    };

    getSecretWord();
  }, [wordSetting, gameId]);

  useEffect(() => {
    if (gameResult === '') {
      setDefinition(null);
      return;
    }

    const getWordDefinition = async () => {
      try {
        const url = `https://freedictionaryapi.com/api/v1/entries/en/${secretWord.toLowerCase()}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        const definition = data.entries[0].senses[0].definition;

        if (definition?.length === 0) {
          throw new Error(`API returned empty definition.`);
        }

        setDefinition(definition);
      } catch (error) {
        console.error(error.message);
        setDefinition(null);
      }
    };

    getWordDefinition();
  }, [gameResult, secretWord]);

  const guessWord = () => {
    const trimmedWord = currentWord.trim().toLowerCase();

    if (trimmedWord.length !== GAME_SETTING[wordSetting]) {
      setErrorMessage(`Word must be ${GAME_SETTING[wordSetting]} letters long`);
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
      {
        word: trimmedWord,
        result: computeLetters(
          trimmedWord,
          secretWord,
          GAME_SETTING[wordSetting],
        ),
      },
    ]);

    if (trimmedWord === secretWord) {
      setGameResult('won');
    } else if (guesses.length + 1 === MAX_GUESSES) {
      setGameResult('lost');
    }
  };

  const newGame = () => {
    setCurrentWord('');
    setGameResult('');
    setErrorMessage('');
    setGuesses([]);
    setWordSetting(selectedLevel);
    setGameId((id) => id + 1);
  };

  return (
    <div className="page-container">
      <WordSettings
        setting={selectedLevel}
        onSettingChange={(event) => setSelectedLevel(event.target.value)}
        onNewGame={() => newGame()}
      />
      <div className={`word-board`}>
        {Array.from({ length: MAX_GUESSES }, (_, index) => (
          <WordRow
            key={index}
            guess={guesses[index] ?? ''}
            setting={wordSetting}
          />
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
          placeholder={`Type in a ${GAME_SETTING[wordSetting]} letter word`}
          id="word-input"
          type="text"
          value={currentWord}
          onChange={(event) => setCurrentWord(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              guessWord();
            }
          }}
        ></input>
        <button
          type="button"
          title="Guess Word"
          disabled={gameResult !== '' || guesses.length >= MAX_GUESSES}
          onClick={() => guessWord()}
        >
          Guess Word
        </button>
        <p className="error-message">{errorMessage}</p>
      </div>
      <div>{definition && <p>{definition}</p>}</div>
    </div>
  );
}

export default App;
