import styled from 'styled-components';
import Accordion from '../../ui/accordion/accordion';
import Communication from '../../blocks/communication/communication';

const StyledAccordion = styled(Accordion)`
  @media screen and (min-width: ${(props) => props.theme.desktopWidth}) {
    position: absolute;
    top: 93px;
    right: 0;
    width: 400px;
  }
`;

const StyledCommunication = styled(Communication)`
  background-color: ${(props) => props.theme.white};
`;

export { StyledAccordion, StyledCommunication };
