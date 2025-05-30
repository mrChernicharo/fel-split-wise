/** @type{HTMLButtonElement} */
const splitBtn = document.querySelector("#split-btn");

/** @type{HTMLListElement} */
const personList = document.querySelector("#person-list");
/** @type{HTMLInputElement} */
const personInput = document.querySelector("#person-input");
/** @type{HTMLButtonElement} */
const personAddBtn = document.querySelector("#person-add-btn");

/** @type{HTMLListElement} */
const purchaseList = document.querySelector("#purchase-list");
/** @type{HTMLInputElement} */
const purchaseItemInput = document.querySelector("#item-input");
/** @type{HTMLInputElement} */
const priceInput = document.querySelector("#price-input");
/** @type{HTMLSelectElement} */
const buyerSelect = document.querySelector("#buyer-select");
/** @type{HTMLDivElement} */
const participantsList = document.querySelector("#participants-list");
/** @type{HTMLButtonElement} */
const purchaseAddBtn = document.querySelector("#purchase-add-btn");

let persons = [];
let purchases = [];

function doSplit() {
    const balance = {};

    purchases.forEach((purchase, i) => {
        const isFirstIteration = i == 0;
        const { buyerCredit, participantDebt } = splitPurchase(purchase);
        const { id, buyer, participants, item, price } = purchase;

        if (isFirstIteration) {
            [buyer, ...participants].forEach((p) => {
                balance[`${p.name}-${p.id}`] = 0;
            });
        }

        balance[`${buyer.name}-${buyer.id}`] += buyerCredit;
        participants.forEach((p) => {
            balance[`${p.name}-${p.id}`] -= participantDebt;
        });
    });

    const creditors = Object.entries(balance)
        .filter(([person, balance]) => balance >= 0)
        .sort(([aName, aBalance], [bName, bBalance]) => bBalance - aBalance);

    const debtors = Object.entries(balance)
        .filter(([person, balance]) => balance < 0)
        .sort(([aName, aBalance], [bName, bBalance]) => aBalance - bBalance);

    let outstandingCredit = 0;
    const [mainCreditor, mainCreditorBalance] = creditors[0];
    const payments = [];

    debtors.forEach(([debtor, debt]) => {
        const value = Math.abs(debt);
        outstandingCredit += value;
        payments.push({ debtor, creditor: mainCreditor, value });
    });

    creditors.forEach(([creditor, credit], i) => {
        outstandingCredit -= credit;
        const nextCreditorEntry = creditors[i + 1];

        if (nextCreditorEntry) {
            const [nextCreditor] = nextCreditorEntry;
            const payment = { debtor: creditor, creditor: nextCreditor, value: outstandingCredit };
            payments.push(payment);
        }
    });

    console.log({ balance, payments });
}

function splitPurchase(purchase) {
    // console.log(purchase);
    const { id, buyer, participants, item, price } = purchase;

    const totalPeople = participants.length + 1;
    const evenSplit = price / totalPeople;
    const buyerCredit = evenSplit * participants.length;
    const participantDebt = evenSplit;

    // console.log({ evenSplit, buyerCredit, participantDebt });
    return { buyerCredit, participantDebt };
}

function createNewId(arr) {
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        const expectedId = i + 1;

        if (item.id != expectedId) {
            return expectedId;
        }
    }

    return arr.length + 1;
}

function getBuyerId() {
    return buyerSelect.value;
}

function addPerson() {
    if (!personInput.value) return;

    const id = createNewId(persons);

    persons.push({ id, name: personInput.value });
    persons.sort((a, b) => a.id - b.id);

    personInput.value = "";
    syncData();
    populatePersonList();
    populateParticipantsList();
    populateBuyerSelect();
}

function deletePerson(ev) {
    const id = ev.target.dataset.personId;
    console.log("deletePerson", { ev, id, persons });
    persons = persons.filter((p) => p.id !== +id);

    syncData();
    populatePersonList();
    populateParticipantsList();
    populateBuyerSelect();
}

function addPurchase() {
    if (!purchaseItemInput.value || priceInput.value <= 0) return;

    const buyerId = getBuyerId();

    const selectedCheckboxes = Array.from(participantsList.children)
        .map((ele) => {
            const children = Array.from(ele.children);
            return children.find((ele) => ele.tagName == "INPUT");
        })
        .filter((checkbox) => checkbox.checked);

    const participantIds = selectedCheckboxes.map((ele) => +ele.id.replace(/\D/g, ""));

    const participants = participantIds.filter((id) => id != buyerId).map((id) => persons.find((p) => p.id == id));

    const purchase = {
        id: createNewId(purchases),
        item: purchaseItemInput.value,
        price: +priceInput.value,
        buyer: persons.find((p) => p.id == buyerId),
        participants,
    };

    purchases.push(purchase);
    purchases.sort((a, b) => a.id - b.id);

    console.log("add purchase", purchase);
    syncData();
    populatePurchaseList();
}

function deletePurchase(ev) {
    console.log("delete");
    const id = ev.target.dataset.purchaseId;
    console.log("deletePerson", { ev, id, purchases });
    purchases = purchases.filter((p) => p.id !== +id);
    syncData();
    populatePurchaseList();
}

function populatePurchaseList() {
    purchaseList.innerHTML = "";

    purchases.forEach((purchase) => {
        const li = document.createElement("li");
        li.value = purchase.id;
        li.textContent = `${purchase.id} ${purchase.item} R$${purchase.price}`;

        const btn = document.createElement("button");
        btn.dataset.purchaseId = purchase.id;
        btn.textContent = "❌";
        btn.addEventListener("click", deletePurchase);

        const innerUl = document.createElement("ul");

        const buyerLi = document.createElement("li");
        buyerLi.textContent = purchase.buyer.name;
        buyerLi.style.color = "goldenrod";
        innerUl.append(buyerLi);

        purchase.participants.forEach((p) => {
            const participantLi = document.createElement("li");
            participantLi.textContent = p.name;
            innerUl.append(participantLi);
        });

        li.append(btn, innerUl);
        purchaseList.append(li);
    });
}

function populateBuyerSelect() {
    buyerSelect.innerHTML = "";

    persons.forEach((person) => {
        const opt = document.createElement("option");
        opt.value = person.id;
        opt.textContent = person.name;
        buyerSelect.append(opt);
    });
}

function populateParticipantsList() {
    participantsList.innerHTML = "";

    console.log(getBuyerId());

    persons.forEach((person) => {
        const div = document.createElement("div");
        div.id = `participant-${person.id}`;
        div.dataset.personId = person.id;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "participants";
        checkbox.id = `checkbox-participant-${person.id}`;
        checkbox.checked = true;

        const label = document.createElement("label");
        label.setAttribute("for", `checkbox-participant-${person.id}`);
        label.textContent = person.name;

        div.append(checkbox, label);
        participantsList.append(div);
    });
}

function populatePersonList() {
    personList.innerHTML = "";

    persons.forEach((person) => {
        const li = document.createElement("li");
        li.value = person.id;
        li.textContent = `${person.name} ID: ${person.id} `;

        const btn = document.createElement("button");
        btn.dataset.personId = person.id;
        btn.textContent = "❌";
        btn.addEventListener("click", deletePerson);

        li.append(btn);
        personList.append(li);
    });
}

function updateUI() {
    populatePersonList();
    populateParticipantsList();
    populateBuyerSelect();
    populatePurchaseList();
}

function syncData() {
    localStorage.setItem("persons", JSON.stringify(persons));
    localStorage.setItem("purchases", JSON.stringify(purchases));
}

function loadStoredData() {
    persons = JSON.parse(localStorage.getItem("persons")) || [];
    purchases = JSON.parse(localStorage.getItem("purchases")) || [];
    updateUI();
}

function appendListeners() {
    personAddBtn.addEventListener("click", addPerson);
    purchaseAddBtn.addEventListener("click", addPurchase);
    splitBtn.addEventListener("click", doSplit);
}

function main() {
    // load stored data
    loadStoredData();

    appendListeners();
}

main();
