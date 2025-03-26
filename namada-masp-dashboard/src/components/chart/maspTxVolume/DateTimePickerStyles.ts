export const customDateTimePickerStyles = `
    .react-datetimerange-picker {
    display: inline-flex;
    position: relative;
    }

    .react-datetimerange-picker,
    .react-datetimerange-picker *,
    .react-datetimerange-picker *:before,
    .react-datetimerange-picker *:after {
    -moz-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    }

    .react-datetimerange-picker--disabled {
    background-color: #202020;
    color: #6d6d6d;
    }

    .react-datetimerange-picker__wrapper {
    display: flex;
    flex-grow: 1;
    flex-shrink: 0;
    align-items: center;
    border: transparent;
    }

    .react-datetimerange-picker__inputGroup {
    min-width: calc(4px + (4px * 3) + 0.54em * 6 + 0.217em * 2);
    height: 100%;
    flex-grow: 1;
    padding: 0 2px;
    }

    .react-datetimerange-picker__inputGroup__divider {
    padding: 1px 0;
    }

    .react-datetimerange-picker__inputGroup__divider,
    .react-datetimerange-picker__inputGroup__leadingZero {
    display: inline-block;
    font: inherit;
    }

    .react-datetimerange-picker__inputGroup__input {
    min-width: 0.54em;
    height: calc(100% - 2px);
    position: relative;
    padding: 1px;
    border: 0;
    background: none;
    color: currentColor;
    font: inherit;
    box-sizing: content-box;
    -webkit-appearance: textfield;
    -moz-appearance: textfield;
    appearance: textfield;
    }

    .react-datetimerange-picker__inputGroup__input::-webkit-outer-spin-button,
    .react-datetimerange-picker__inputGroup__input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    margin: 0;
    }

    .react-datetimerange-picker__inputGroup__input:invalid {
    background: rgba(255, 0, 0, 0.1);
    }

    .react-datetimerange-picker__inputGroup__input--hasLeadingZero {
    margin-left: -0.54em;
    padding-left: calc(1px + 0.54em);
    }

    .react-datetimerange-picker__inputGroup__amPm {
    font: inherit;
    -webkit-appearance: menulist;
    -moz-appearance: menulist;
    appearance: menulist;
    }

    .react-datetimerange-picker__button {
    border: 0;
    background: transparent;
    padding: 4px 6px;
    }

    .react-datetimerange-picker__button:enabled {
    cursor: pointer;
    }

    .react-datetimerange-picker__button:enabled .react-datetimerange-picker__button__icon,
    .react-datetimerange-picker__button:enabled .react-datetimerange-picker__button__icon {
    stroke: #ccc;
    width: 14px;
    height: 14px;
    }

    .react-datetimerange-picker__button:enabled:hover .react-datetimerange-picker__button__icon,
    .react-datetimerange-picker__button:enabled:focus .react-datetimerange-picker__button__icon {
    stroke: #ee0;
    }

    .react-datetimerange-picker__button:disabled .react-datetimerange-picker__button__icon {
    stroke: #6d6d6d;
    }

    .react-datetimerange-picker__button svg {
    display: inherit;
    }

    .react-datetimerange-picker__calendar,
    .react-datetimerange-picker__clock {
    z-index: 1;
    }

    .react-datetimerange-picker__calendar--closed,
    .react-datetimerange-picker__clock--closed {
    display: none;
    }

    .react-datetimerange-picker__calendar {
    width: 350px;
    max-width: 100vw;
    }

    .react-datetimerange-picker__calendar .react-calendar {
    border-width: thin;
    }

    .react-datetimerange-picker__clock {
    width: 200px;
    height: 200px;
    max-width: 100vw;
    padding: 25px;
    background-color: white;
    border: thin solid #a0a096;
    }



    .react-calendar {
    width: 350px;
    max-width: 100%;
    background: #3A3A3A;
    border: 1px solid #a0a096;
    font-family: 'Arial', 'Helvetica', sans-serif;
    line-height: 1.125em;
    }

    .react-calendar--doubleView {
    width: 700px;
    }

    .react-calendar--doubleView .react-calendar__viewContainer {
    display: flex;
    margin: -0.5em;
    }

    .react-calendar--doubleView .react-calendar__viewContainer > * {
    width: 50%;
    margin: 0.5em;
    }

    .react-calendar,
    .react-calendar *,
    .react-calendar *:before,
    .react-calendar *:after {
    -moz-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    }

    .react-calendar button {
    margin: 0;
    border: 0;
    outline: none;
    }

    .react-calendar button:enabled:hover {
    cursor: pointer;
    }

    .react-calendar__navigation {
    display: flex;
    height: 44px;
    margin-bottom: 1em;
    }

    .react-calendar__navigation button {
    min-width: 44px;
    background: none;
    }

    .react-calendar__navigation button:disabled {
    background-color: #202020;
    }

    .react-calendar__navigation button:enabled:hover,
    .react-calendar__navigation button:enabled:focus {
    background-color: #666;
    }

    .react-calendar__month-view__weekdays {
    text-align: center;
    text-transform: uppercase;
    font: inherit;
    font-size: 0.75em;
    font-weight: bold;
    }

    .react-calendar__month-view__weekdays__weekday {
    padding: 0.5em;
    }

    .react-calendar__month-view__weekNumbers .react-calendar__tile {
    display: flex;
    align-items: center;
    justify-content: center;
    font: inherit;
    font-size: 0.75em;
    font-weight: bold;
    }

    .react-calendar__month-view__days__day--weekend {
    color: #fff;
    }

    .react-calendar__month-view__days__day--neighboringMonth,
    .react-calendar__decade-view__years__year--neighboringDecade,
    .react-calendar__century-view__decades__decade--neighboringCentury {
    color: #757575;
    }

    .react-calendar__year-view .react-calendar__tile,
    .react-calendar__decade-view .react-calendar__tile,
    .react-calendar__century-view .react-calendar__tile {
    padding: 2em 0.5em;
    }

    .react-calendar__tile {
    max-width: 100%;
    padding: 10px 6.6667px;
    background: none;
    text-align: center;
    font: inherit;
    font-size: 0.833em;
    }

    .react-calendar__tile:disabled {
    background-color: #222;
    color: #ababab;
    }

    .react-calendar__month-view__days__day--neighboringMonth:disabled,
    .react-calendar__decade-view__years__year--neighboringDecade:disabled,
    .react-calendar__century-view__decades__decade--neighboringCentury:disabled {
    color: #666;
    }

    .react-calendar__tile:enabled:hover,
    .react-calendar__tile:enabled:focus {
    background-color: #666;
    }

    .react-calendar__tile--now {
    background: inherit;
    color: white;
    }

    .react-calendar__tile--now:enabled:hover,
    .react-calendar__tile--now:enabled:focus {
    background: #666;
    }

    .react-calendar__tile--hasActive {
    background: #ff0;
    color: #000;
    }

    .react-calendar__tile--hasActive:enabled:hover,
    .react-calendar__tile--hasActive:enabled:focus {
    background: #dd0;
    }

    .react-calendar__tile--active {
    background: #ff0;
    color: #000;
    }

    .react-calendar__tile--active:enabled:hover,
    .react-calendar__tile--active:enabled:focus {
    background: #dd0;
    }

    .react-calendar--selectRange .react-calendar__tile--hover {
    background-color: #550;
    }
`;