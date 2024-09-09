
        document.addEventListener('DOMContentLoaded', function() {
            let marksData = {}; 

fetch('http://localhost:3000/api/getMarks') 
    .then(response => {
        console.log('Response status:', response.status); 
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        marksData = data; 
        console.log(marksData);
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });

            
            let chart;

            document.getElementById('accountForm').addEventListener('submit', function(event) {
                event.preventDefault();

                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const role = document.getElementById('role').value;

                fetch('http://localhost:3000/api/addAccount', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password, role })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Success:', data);
                    alert('تم إضافة الحساب بنجاح!');
                    
                    
                    document.getElementById('username').value = '';
                    document.getElementById('password').value = '';
                    document.getElementById('role').value = 'student'; 
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('حدث خطأ أثناء إضافة الحساب.');
                });
            });

            document.getElementById('loadMarks').addEventListener('click', function() {
                const option = document.getElementById('marksOption').value;
                displayMarks(option);
            });

            function displayMarks(option) {
    const tableContainer = document.getElementById('marksTable');
    tableContainer.innerHTML = ''; 

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Create table header
    const headerRow = document.createElement('tr');
    const thName = document.createElement('th');
    thName.textContent = 'اسم الطالب';
    const thMark = document.createElement('th');
    thMark.textContent = 'العلامة';
    headerRow.appendChild(thName);
    headerRow.appendChild(thMark);
    thead.appendChild(headerRow);

    const labels = ['ناجح', 'راسب'];
    const data = [0, 0]; 

    if (option === 'all') {
        
        for (const [name, mark] of Object.entries(marksData)) {
            const row = document.createElement('tr');
            const tdName = document.createElement('td');
            tdName.textContent = name;
            const tdMark = document.createElement('td');
            tdMark.textContent = mark;
            row.appendChild(tdName);
            row.appendChild(tdMark);
            tbody.appendChild(row);
            
            
            if (mark >= 60) {
                data[0] += 1; 
            } else {
                data[1] += 1; 
            }
        }
    } else if (option === 'failing') {
        
        for (const [name, mark] of Object.entries(marksData)) {
            if (mark < 60) {
                const row = document.createElement('tr');
                const tdName = document.createElement('td');
                tdName.textContent = name;
                const tdMark = document.createElement('td');
                tdMark.textContent = mark;
                row.appendChild(tdName);
                row.appendChild(tdMark);
                tbody.appendChild(row);

                data[1] += 1; 
            }
        }
    } else if (option === 'highest') {
        
        const highestMark = Math.max(...Object.values(marksData));
        for (const [name, mark] of Object.entries(marksData)) {
            if (mark === highestMark) {
                const row = document.createElement('tr');
                const tdName = document.createElement('td');
                tdName.textContent = name;
                const tdMark = document.createElement('td');
                tdMark.textContent = mark;
                row.appendChild(tdName);
                row.appendChild(tdMark);
                tbody.appendChild(row);

                
                data[0] += 1; 
            }
        }
    } else if (option === 'lowest') {
        
        const lowestMark = Math.min(...Object.values(marksData));
        for (const [name, mark] of Object.entries(marksData)) {
            if (mark === lowestMark) {
                const row = document.createElement('tr');
                const tdName = document.createElement('td');
                tdName.textContent = name;
                const tdMark = document.createElement('td');
                tdMark.textContent = mark;
                row.appendChild(tdName);
                row.appendChild(tdMark);
                tbody.appendChild(row);

                
                data[1] += 1; 
            }
        }
    } else if (option === 'average') {
        const totalMarks = Object.values(marksData).reduce((acc, mark) => acc + mark, 0);
        const averageMark = totalMarks / Object.values(marksData).length;
        const row = document.createElement('tr');
        const tdName = document.createElement('td');
        tdName.textContent = 'متوسط النجاح';
        const tdMark = document.createElement('td');
        tdMark.textContent = averageMark.toFixed(2);
        row.appendChild(tdName);
        row.appendChild(tdMark);
        tbody.appendChild(row);

        labels.push('متوسط النجاح');
        data.push(averageMark);
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    tableContainer.appendChild(table);

    if (chart) {
        chart.destroy();
    }

    const ctx = document.getElementById('marksChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'العلامات',
                data: data,
                backgroundColor: [
                    'rgba(0, 0, 0, 0.5)', // transparent blue
                    'rgba(255, 255, 255, 0.5)'  // transparent red
                ],
                borderColor: [
                    '#ffffff', // white
                    '#ffffff'
                ],
                borderWidth: 1,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 18, // Font size for legend labels
                            weight: 'bold' // Font weight
                        },
                        color: '#ffffff', // Font color
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.raw !== null) {
                                label += context.raw + ' طالب';
                            }
                            return label;
                        }
                    },
                    bodyFont: {
                        size: 16, // Font size in tooltips
                        weight: 'bold' // Font weight in tooltips
                    }
                }
            }
        }
    });
}
  });
  