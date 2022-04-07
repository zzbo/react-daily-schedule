// import logo from './logo.svg';
import './App.css';
import DailySchedule from './components/DailySchedule';

function App() {
  return (
    <div className="App">
      <DailySchedule
        title="my daily schedule"
        scheduleData={[]}
        onAdd={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        onSelectDate={() => {}}
        onScheduleItemClick={() => {}}
      />
    </div>
  );
}

export default App;
