import { useState } from 'react';
import logo from './logo.svg';
import './App.css';

const { VITE_API_URL } = import.meta.env;

function App() {
	const [resp, setResp] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState<boolean>(false);

	const handleClickTest = async () => {
		console.log('VITE_API_URL', VITE_API_URL);
		setError(null);
		setResp(null);
		setLoading(true);

		await fetch(VITE_API_URL)
			.then((response) => response.json())
			.then((data: string) => {
				console.log(data);
				setResp(data);
			})
			.catch((err: Error) => {
				console.error('err:', err);
				setError(err.message);
			})
			.finally(() => {
				setLoading(false);
			});
	};

	return (
		<div className="App">
			<header className="App-header">
				<img src={logo} className="App-logo" alt="logo" />
				<p>
					Project MBDS
				</p>
				<br />
				<button type="button" onClick={handleClickTest}>Call API for test</button>
				{loading && <p>loading...</p>}
				{resp && <p>ok = {resp}</p>}
				{error && <p>error = {error}</p>}
			</header>
		</div>
	);
}

export default App;
