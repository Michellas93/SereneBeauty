import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StepSelectService from './steps/StepSelectService';
import StepSelectDateTime from './steps/StepSelectDateTime';
import StepSelectStylist from './steps/StepSelectStylist';
import StepConfirm from './steps/StepConfirm';

const TOTAL_STEPS = 4;

export default function BookingFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [booking, setBooking] = useState({
    services: [],
    date: null,
    time: null,
    stylist: null,
    name: '',
    phone: '',
    email: '',
  });

  const update = (patch) => setBooking((b) => ({ ...b, ...patch }));

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => {
    if (step === 0) {
      navigate('/');
    } else {
      if (step === 1) update({ stylist: null, date: null, time: null });
      if (step === 2) update({ date: null, time: null });
      setStep((s) => s - 1);
    }
  };
  const goHome = () => navigate('/');

  const onHome = step > 0 ? goHome : undefined;

  return (
    <div>
      {step === 0 && <StepSelectService booking={booking} update={update} onNext={next} onBack={back} step={step} totalSteps={TOTAL_STEPS} />}
      {step === 1 && <StepSelectStylist booking={booking} update={update} onNext={next} onBack={back} onHome={onHome} step={step} totalSteps={TOTAL_STEPS} />}
      {step === 2 && <StepSelectDateTime booking={booking} update={update} onNext={next} onBack={back} onHome={onHome} step={step} totalSteps={TOTAL_STEPS} />}
      {step === 3 && <StepConfirm booking={booking} update={update} onBack={back} onHome={onHome} step={step} totalSteps={TOTAL_STEPS} />}
    </div>
  );
}
