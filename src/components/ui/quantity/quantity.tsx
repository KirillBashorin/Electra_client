import { useState } from 'react';
import { StyledQuantity, QuantityInput, QuantityButton } from './styled';
import MinusIco from '../../../assets/quantity-minus.svg?react';
import PlusIco from '../../../assets/quantity-plus.svg?react';

interface IQuantity {
  setExternalState: (quantity: number) => void;
}

const Quantity: React.FC<IQuantity> = ({ setExternalState }) => {
  const [quantity, setQuantity] = useState(1);

  const handleDecrease = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      setExternalState(newQuantity);
    }
  };

  const handleIncrease = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    setExternalState(newQuantity);
  };

  const handleOnChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const value = evt.target.value;
    const parsedValue = parseInt(value);
    if (parsedValue > 0) {
      setQuantity(parsedValue);
      setExternalState(parsedValue);
    }
  };

  return (
    <StyledQuantity>
      <QuantityButton $isLeft={true} onClick={handleDecrease}>
        <MinusIco />
      </QuantityButton>
      <QuantityInput
        type={'number'}
        value={quantity}
        onChange={handleOnChange}
      />
      <QuantityButton onClick={handleIncrease}>
        <PlusIco />
      </QuantityButton>
    </StyledQuantity>
  );
};

export default Quantity;
