import React, { useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import '@fontsource/raleway'; // Import a modern font
import mixpanel from 'mixpanel-browser';

mixpanel.init('3c2b5ecba43167fc94001a0b2ce32da5');
// Styled components
const Container = styled.div`
  width: 100%;
  margin: 0 auto;
  min-height: 100vh;
  padding: 20px;
  background-color: #1e1e1e;
  color: #e0e0e0;
  font-family: 'Raleway', sans-serif;
  overflow: auto;
`;

const InputForm = styled(motion.form)`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const InputField = styled(motion.input)`
  width: 100%;
  max-width: 500px; /* Adjusted for better mobile readability */
  margin-bottom: 15px;
  padding: 15px;
  border: 1px solid #333;
  border-radius: 8px;
  background-color: #2c2c2c;
  color: #e0e0e0;
  font-size: 16px;
  outline: none;
  transition: border-color 0.3s;
  
  &:focus {
    border-color: #007bff;
  }
`;

const SubmitButton = styled(motion.button)`
  padding: 15px 25px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #0056b3;
  }
`;

const Results = styled.div`
  display: flex;
  flex-wrap: wrap; /* Allow wrapping on smaller screens */
  gap: 20px; /* Space between columns */
  margin-top: 30px;
  overflow: auto;

  @media (max-width: 768px) {
    flex-direction: column; /* Stack columns vertically on mobile */
  }
`;

const ResultColumn = styled.div`
  flex: 1;
  background-color: #2c2c2c;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  max-height: 60vh;
  overflow-y: auto;

  @media (max-width: 768px) {
    width: 100%; /* Full width on mobile */
    margin-bottom: 15px; /* Space between stacked columns */
  }
`;

const Reason = styled(motion.div)`
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 8px;
`;

const Header = styled.h1`
  text-align: center;
  margin-bottom: 20px;
  font-size: 2em; /* Adjusted for better mobile readability */
  color: #ffffff;
`;

const Loader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
`;

const LoaderSpinner = styled.div`
  border: 8px solid rgba(0, 0, 0, 0.1);
  border-left: 8px solid #007bff;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Animation variants
const formVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const reasonVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

const App = () => {
  const [idea, setIdea] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    mixpanel.track('Analyze Idea',{
      idea
    });
    setLoading(true); // Start loading
    try {
      const response = await axios.post('https://one3reasonswhy-backend.onrender.com/generate-insights', { idea });
      setResults(response.data);
    } catch (error) {
      console.error('Error submitting idea:', error);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <Container>
      <Header>13 Reasons Why</Header>
      <InputForm
        onSubmit={handleSubmit}
        variants={formVariants}
        initial="hidden"
        animate="visible"
      >
        <InputField
          type="text"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Enter your next million dollar idea!"
          required
        />
        <SubmitButton
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Analyze
        </SubmitButton>
      </InputForm>
      {loading ? (
        <Loader>
          <LoaderSpinner />
        </Loader>
      ) : results && (
        <Results>
          <ResultColumn>
            <motion.h2
              variants={formVariants}
              initial="hidden"
              animate="visible"
            >
              Reasons Why It Might Succeed
            </motion.h2>
            {results.insights.success.map((reason, index) => (
              <Reason key={index} variants={reasonVariants} initial="hidden" animate="visible">
                {index + 1}. {reason}
              </Reason>
            ))}
          </ResultColumn>
          <ResultColumn>
            <motion.h2
              variants={formVariants}
              initial="hidden"
              animate="visible"
            >
              Reasons Why It Might Fail
            </motion.h2>
            {results.insights.failure.map((reason, index) => (
              <Reason key={index} variants={reasonVariants} initial="hidden" animate="visible">
                {index + 1}. {reason}
              </Reason>
            ))}
          </ResultColumn>
        </Results>
      )}
    </Container>
  );
};

export default App;
