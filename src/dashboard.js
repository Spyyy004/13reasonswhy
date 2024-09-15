import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, LineElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, ArcElement, LineElement, CategoryScale, LinearScale);

const Dashboard = () => {
    const [transactions, setTransactions] = useState([]);
    const [insights, setInsights] = useState({});
    const [challenges, setChallenges] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Fetch the data from your backend when the component mounts
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.post('/upload-csv', /* CSV file data here */);
                setTransactions(response.data.transactions);

                // Get insights and challenges from the backend
                const insightsResponse = await axios.post('/generate-insights', { transactions: response.data.transactions });
                setInsights(insightsResponse.data.insights);

                const challengesResponse = await axios.post('/generate-challenges', { transactions: response.data.transactions });
                setChallenges(challengesResponse.data.challenge);

            } catch (err) {
                setError("Error fetching data");
                console.error(err);
            }
            setLoading(false);
        };

        fetchData();
    }, []);

    // Prepare data for the charts
    const categories = {};
    transactions.forEach(transaction => {
        const category = transaction.category || 'Misc';
        const amount = parseFloat(transaction.amount);
        if (!categories[category]) categories[category] = 0;
        categories[category] += amount;
    });

    const categoryLabels = Object.keys(categories);
    const categoryData = Object.values(categories);

    const spendingData = {
        labels: categoryLabels,
        datasets: [{
            data: categoryData,
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#E7E9ED'],
        }],
    };

    const dates = transactions.map(transaction => new Date(transaction.date).toLocaleDateString());
    const amounts = transactions.map(transaction => parseFloat(transaction.amount));

    const spendingTrendsData = {
        labels: dates,
        datasets: [{
            label: 'Spending Over Time',
            data: amounts,
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: true,
        }],
    };

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>
            {loading && <p>Loading...</p>}
            {error && <p className="error">{error}</p>}
            
            <div className="summary">
                <h2>Summary</h2>
                <p>Total Transactions: {transactions.length}</p>
                <p>Total Amount Spent: ${transactions.reduce((acc, t) => acc + parseFloat(t.amount), 0).toFixed(2)}</p>
            </div>

            <div className="visualizations">
                <h2>Spending Breakdown by Category</h2>
                <Pie data={spendingData} />
                
                <h2>Monthly Spending Trends</h2>
                <Line data={spendingTrendsData} />
            </div>

            <div className="insights">
                <h2>Key Insights</h2>
                <p>{insights}</p>
            </div>

            <div className="challenges">
                <h2>Spending Challenges</h2>
                <p>{challenges}</p>
            </div>

            <div className="transactions">
                <h2>Detailed Transactions</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Category</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((transaction, index) => (
                            <tr key={index}>
                                <td>{transaction.date}</td>
                                <td>${parseFloat(transaction.amount).toFixed(2)}</td>
                                <td>{transaction.category || 'Misc'}</td>
                                <td>{transaction.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;
