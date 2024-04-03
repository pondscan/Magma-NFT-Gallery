document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addressInput').value = preloadAddress;
    console.log('Starting fetch for preloaded address:', preloadAddress);
    fetchTokenCollections(preloadAddress);
});

document.addEventListener('DOMContentLoaded', () => {
    // Add an event listener to the fetch button
    document.getElementById('fetchButton').addEventListener('click', function() {
        const address = document.getElementById('addressInput').value.trim();
        if (address) {
            fetchTokenCollections(address);
        } else {
            alert('Please enter an address.');
        }
    });
});


function fetchTokenCollections(address) {
    const apiUrl = `https://magmascan.org/api/v2/addresses/${address}/tokens?type=ERC-721`;
    console.log('Fetching collections:', apiUrl);

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            console.log('Collections fetched:', data.items);
            populateCollectionsDropdown(data.items, address);
            data.items.forEach(collection => {
                console.log('Fetching instances for collection:', collection.token.name);
                fetchNFTInstances(collection.token.address, address);
            });
        })
        .catch(error => console.error('Error fetching token collections:', error));
}

function populateCollectionsDropdown(collections, address) {
    const dropdown = document.getElementById('collectionsMenu');
    dropdown.innerHTML = '<option value="">All Collections</option>';
    console.log('Populating dropdown with collections');

    collections.forEach(collection => {
        const option = document.createElement('option');
        option.value = collection.token.address;
        option.textContent = `${collection.token.name} (${collection.value} owned)`;
        dropdown.appendChild(option);
    });

    dropdown.addEventListener('change', function() {
        const tokenAddress = this.value;
        const cardsContainer = document.getElementById('nftCards');
        cardsContainer.innerHTML = ''; // Clear current display
        if (tokenAddress) {
            console.log('Dropdown selection changed. Fetching instances for:', tokenAddress);
            fetchNFTInstances(tokenAddress, address);
        } else {
            console.log('Dropdown selection changed. Fetching all instances.');
            collections.forEach(collection => fetchNFTInstances(collection.token.address, address));
        }
    });
}

// Fetches NFT instances from a collection owned by the address, paginating by unique_token
function fetchNFTInstances(tokenAddress, address, uniqueToken = '') {
    let tokenInstancesUrl = `https://magmascan.org/api/v2/tokens/${tokenAddress}/instances`;

    // Use '?' to start the query string if uniqueToken is the first parameter; otherwise, use '&'.
    tokenInstancesUrl += uniqueToken ? `?unique_token=${uniqueToken}` : '';

    console.log('Fetching NFT instances from:', tokenInstancesUrl);

    fetch(tokenInstancesUrl)
        .then(response => response.json())
        .then(data => {
            if (data.items && data.items.length > 0) {
                console.log(`NFT instances fetched for address ${address} from ${tokenAddress}: `, data.items.length);
                data.items.forEach(instance => {
                    if (instance.owner.hash.toLowerCase() === address.toLowerCase()) {
                        const imageUrl = instance.metadata?.image || instance.image_url || 'path_to_default_placeholder_image_url';
                        addNFTCard(instance, imageUrl);
                    }
                });

                if (data.next_page_params && data.next_page_params.unique_token) {
                    fetchNFTInstances(tokenAddress, address, data.next_page_params.unique_token);
                }
            } else {
                console.log('No NFT instances found or end of data reached.');
            }
        })
        .catch(error => console.error('Error fetching NFT instances:', error));
}



function addNFTCard(nftInstance, imageUrl) {
    const cardsContainer = document.getElementById('nftCards');
    const card = document.createElement('div');
    card.className = 'card';
    console.log('Adding NFT card for:', nftInstance.token.name, 'ID:', nftInstance.id);

    card.innerHTML = `
        <img src="${imageUrl}" alt="NFT Image" onerror="this.onerror=null;this.src='path_to_default_placeholder_image_url';">
        <div class="card-content">
            <h3 class="card-title">${nftInstance.token.name}</h3>
            <p class="card-text">ID: ${nftInstance.id}</p>
        </div>
    `;

    cardsContainer.appendChild(card);
}

function truncateString(str, num) {
    return str.length <= num ? str : `${str.slice(0, num)}...`;
}
