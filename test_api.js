// Quick test script to check API
const token = localStorage.getItem('token');
const role = localStorage.getItem('userRole');

console.log('Token:', token);
console.log('Role:', role);

fetch('http://localhost:5000/api/projects', {
    headers: {
        'Authorization': token ? `Bearer ${token}` : ''
    }
})
    .then(res => res.json())
    .then(data => console.log('Projects:', data))
    .catch(err => console.error('Error:', err));
