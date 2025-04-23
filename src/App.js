import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './components/Home';
import About from './components/About';
import Contact from './components/Contact';
import { setDocumentDirection } from './utils/languageUtils';

function App() {
  // Set language and direction - update with your actual language state management
  useEffect(() => {
    // Example: Get language from localStorage or state management
    const currentLang = localStorage.getItem('language') || 'en';
    setDocumentDirection(currentLang);
  }, []);

  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;