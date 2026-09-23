export default function WordSettings({ setting, onSettingChange, onNewGame }) {
  return (
    <div className='word-settings'>
      <fieldset>
        <div className='radio-group'>
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
        <div className='radio-group'>
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
        <div className='radio-group'>
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
      <button className='button_primary green' onClick={onNewGame}>New Game</button>
    </div>
  );
}