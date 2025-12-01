document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('adventButton');
    const dateText = document.getElementById('dateText');
    const messageDisplay = document.getElementById('message');

    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleString('default', { month: 'long' });
    const dateString = `${day} ${month}`;

    // Storage keys
    const STORAGE_KEY_DATE = 'adventLastOpenedDate';
    const STORAGE_KEY_MESSAGE = 'adventLastMessage';
    const STORAGE_KEY_USED_INDICES = 'adventUsedIndices';

    // Expose reset function for testing
    window.resetAdvent = () => {
        localStorage.removeItem(STORAGE_KEY_DATE);
        localStorage.removeItem(STORAGE_KEY_MESSAGE);
        // We might want to keep used indices to not repeat, but for full reset:
        // localStorage.removeItem(STORAGE_KEY_USED_INDICES); 
        // The user asked to reset the "see you tomorrow" button, which is controlled by DATE.
        // Let's just clear the date and message so they can click again today.
        console.log("Advent calendar state for today reset!");
        location.reload();
    };

    // Check if already opened today
    const lastOpenedDate = localStorage.getItem(STORAGE_KEY_DATE);
    const savedMessage = localStorage.getItem(STORAGE_KEY_MESSAGE);

    if (lastOpenedDate === dateString && savedMessage) {
        // Already opened today
        showOpenedState(savedMessage);
    } else {
        // Not opened today
        dateText.textContent = dateString;
        button.addEventListener('click', openGift);
    }

    function showOpenedState(msg) {
        button.disabled = true;
        dateText.textContent = "See you tomorrow!";
        messageDisplay.textContent = msg;
        messageDisplay.classList.remove('hidden');

        // Change button style to indicate it's done
        button.style.background = '#165B33'; // Green for done
        button.style.boxShadow = 'none';
        button.style.transform = 'scale(0.95)';
    }

    async function openGift() {
        // Disable button immediately to prevent double clicks
        button.disabled = true;
        dateText.textContent = "Opening...";

        try {
            // Fetch sentences
            const response = await fetch('sentences.json');
            if (!response.ok) {
                throw new Error('Failed to load sentences');
            }
            const allSentences = await response.json();

            // Get used indices
            let usedIndices = JSON.parse(localStorage.getItem(STORAGE_KEY_USED_INDICES) || '[]');

            // Filter out used sentences
            // We need to map indices to sentences to know which ones are available
            // Actually, let's just pick an index that isn't in usedIndices
            const availableIndices = allSentences
                .map((_, index) => index)
                .filter(index => !usedIndices.includes(index));

            if (availableIndices.length === 0) {
                // All sentences used!
                const msg = "Merry Christmas! (No more messages left)";
                showOpenedState(msg);
                // Save this state so it persists today
                localStorage.setItem(STORAGE_KEY_DATE, dateString);
                localStorage.setItem(STORAGE_KEY_MESSAGE, msg);
                return;
            }

            // Pick a random index from available ones
            const randomIdx = Math.floor(Math.random() * availableIndices.length);
            const pickedIndex = availableIndices[randomIdx];
            const sentence = allSentences[pickedIndex];

            // Save state
            usedIndices.push(pickedIndex);
            localStorage.setItem(STORAGE_KEY_USED_INDICES, JSON.stringify(usedIndices));
            localStorage.setItem(STORAGE_KEY_DATE, dateString);
            localStorage.setItem(STORAGE_KEY_MESSAGE, sentence);

            // Update UI
            showOpenedState(sentence);

            // Vibration
            if (navigator.vibrate) {
                navigator.vibrate(200);
            }

        } catch (error) {
            console.error('Error opening gift:', error);
            dateText.textContent = "Error!";
            button.disabled = false; // Re-enable if error
            alert("Oops! Something went wrong. Please try again.");
        }
    }

    // --- Menu Logic ---
    const menuButton = document.getElementById('menuButton');
    const menuOptions = document.getElementById('menuOptions');
    const btnResetCalendar = document.getElementById('btnResetCalendar');
    const btnResetDay = document.getElementById('btnResetDay');
    const btnPrintUsed = document.getElementById('btnPrintUsed');

    menuButton.addEventListener('click', () => {
        menuOptions.classList.toggle('hidden');
    });

    // Reset Calendar: Clear all storage and reload
    btnResetCalendar.addEventListener('click', () => {
        if (confirm("Are you sure you want to reset the ENTIRE calendar? This will clear all history.")) {
            localStorage.clear();
            location.reload();
        }
    });

    // Reset Day: Remove today's entry if it exists
    btnResetDay.addEventListener('click', () => {
        const lastOpened = localStorage.getItem(STORAGE_KEY_DATE);
        if (lastOpened !== dateString) {
            alert("You haven't opened a gift today yet!");
            return;
        }

        if (confirm("Reset today? The gift will be put back in the pile.")) {
            // 1. Remove today's date and message
            localStorage.removeItem(STORAGE_KEY_DATE);
            localStorage.removeItem(STORAGE_KEY_MESSAGE);

            // 2. Remove the last used index from the list
            let usedIndices = JSON.parse(localStorage.getItem(STORAGE_KEY_USED_INDICES) || '[]');
            if (usedIndices.length > 0) {
                usedIndices.pop(); // Remove the last one added (which was today's)
                localStorage.setItem(STORAGE_KEY_USED_INDICES, JSON.stringify(usedIndices));
            }

            location.reload();
        }
    });

    // Print Used: Show list of used sentences
    btnPrintUsed.addEventListener('click', async () => {
        try {
            // We need the sentences to map indices to text
            const response = await fetch('sentences.json');
            const allSentences = await response.json();
            const usedIndices = JSON.parse(localStorage.getItem(STORAGE_KEY_USED_INDICES) || '[]');

            if (usedIndices.length === 0) {
                alert("No gifts opened yet.");
                return;
            }

            const usedSentences = usedIndices.map(index => `- ${allSentences[index]}`);
            alert("Used Sentences:\n\n" + usedSentences.join('\n'));

        } catch (error) {
            console.error("Error fetching sentences for print:", error);
            alert("Could not load sentences.");
        }
    });
});
