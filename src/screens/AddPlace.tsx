import { useNavigate } from 'react-router-dom'
import { Screen, TopBar } from '../components/Screen'
import { PlacePicker } from '../components/PlacePicker'
import { useApp } from '../state/AppState'
import { cityView } from '../data/sample'

/* Opened from Profile. Same picker as onboarding, starting in the city centre. */
export function AddPlace() {
  const navigate = useNavigate()
  const { addPlace } = useApp()

  return (
    <Screen>
      <TopBar
        title="Add a place"
        subtitle="Get a warning for this spot"
        fallback="/profile"
      />
      <div className="px-4 pb-5">
        <PlacePicker
          start={cityView.center}
          startKind="home"
          saveText="Save place"
          mapHeight={340}
          onSave={(place) => {
            addPlace(place)
            navigate('/profile')
          }}
        />
      </div>
    </Screen>
  )
}
