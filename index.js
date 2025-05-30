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
const purchaseParticipantsList = document.querySelector("#participants-list");
/** @type{HTMLButtonElement} */
const purchaseAddBtn = document.querySelector("#purchase-add-btn");

/** @type{HTMLListElement} */
const finalPaymentsList = document.querySelector("#final-payments-list");

let persons = [];
let purchases = [];
let finalPayments = [];

/* core logic */
function doSplit() {
    const balance = {};

    // initialize balance
    persons.forEach((p) => {
        balance[`${p.name}-${p.id}`] = 0;
    });
    // check purchases one by one, calculate balance of each user accordingly
    purchases.forEach((purchase, i) => {
        const { buyerCredit, participantDebt } = splitPurchase(purchase);
        const { id, buyer, participants, item, price } = purchase;

        balance[`${buyer.name}-${buyer.id}`] += buyerCredit;
        participants.forEach((p) => {
            balance[`${p.name}-${p.id}`] -= participantDebt;
        });
    });
    console.log("doSplit #1", { balance, purchases });

    // separate creditors (positive balance) from debtors (negative balance)
    const creditors = Object.entries(balance)
        .filter(([person, balance]) => balance >= 0)
        .sort(([aName, aBalance], [bName, bBalance]) => bBalance - aBalance);

    const debtors = Object.entries(balance)
        .filter(([person, balance]) => balance < 0)
        .sort(([aName, aBalance], [bName, bBalance]) => aBalance - bBalance);

    finalPayments = [];
    let outstandingCredit = 0;
    const [mainCreditor, mainCreditorBalance] = creditors[0];

    // all debtors pay their debts to the mainCreditor (the creditor who's spent more money)
    // create a payment entry for each debtor towards the mainCreditor
    debtors.forEach(([debtor, debt]) => {
        const value = Math.abs(debt);
        outstandingCredit += value;
        const payment = { debtor, creditor: mainCreditor, value };
        console.log("debtor payment", payment);
        finalPayments.push(payment);
    });
    // then mainCreditor subtracts the gross value of all payments he's received.
    // this what we call the outstandingCredit.
    // create a payment from the mainCreditor to the nextCreditor in the value of outstandingCredit
    // keep doing so from a creditor to the next until the outstandingCredit equals to zero
    creditors.forEach(([creditor, credit], i) => {
        outstandingCredit -= credit;
        const nextCreditorEntry = creditors[i + 1];

        if (nextCreditorEntry && outstandingCredit != 0) {
            const [nextCreditor] = nextCreditorEntry;
            const payment = { debtor: creditor, creditor: nextCreditor, value: outstandingCredit };
            console.log("creditor payment", payment);
            finalPayments.push(payment);
        }
    });

    console.log("doSplit #2", { balance, finalPayments });
    syncData();
}

function splitPurchase(purchase) {
    const { id, buyer, participants, item, price } = purchase;

    const totalPeople = participants.length + 1;
    const participantDebt = price / totalPeople; // even split
    const buyerCredit = participantDebt * participants.length;

    // console.log("splitPurchase", { price, participantDebt, buyerCredit });
    return { buyerCredit, participantDebt };
}

/* helpers */
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

function getPersonBalance(person) {
    let personBalance = 0;
    (purchases || []).forEach((purchase) => {
        const { buyerCredit, participantDebt } = splitPurchase(purchase);
        if (purchase.buyer.id == person.id) {
            personBalance += buyerCredit;
        } else if (purchase.participants.some((part) => part.id == person.id)) {
            personBalance -= participantDebt;
        }
    });
    return personBalance;
}

function getBuyerId() {
    return buyerSelect.value;
}

/* events */
function addPerson() {
    if (!personInput.value) return;

    const id = createNewId(persons);

    persons.push({ id, name: personInput.value });
    persons.sort((a, b) => a.id - b.id);

    personInput.value = "";
    doSplit();
    populatePersonList();
    populateParticipantsList();
    populateBuyerSelect();
    populateFinalPaymentsList();
}

function deletePerson(ev) {
    const id = ev.target.dataset.personId;
    console.log("deletePerson", { ev, id, persons });
    persons = persons.filter((p) => p.id !== +id);

    doSplit();
    populatePersonList();
    populateParticipantsList();
    populateBuyerSelect();
    populateFinalPaymentsList();
}

function addPurchase() {
    if (!purchaseItemInput.value || priceInput.value <= 0) return;

    const buyerId = getBuyerId();

    const selectedCheckboxes = Array.from(purchaseParticipantsList.children)
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
    doSplit();
    populatePurchaseList();
    populatePersonList();
    populateFinalPaymentsList();
}

function deletePurchase(ev) {
    console.log("delete");
    const id = ev.target.dataset.purchaseId;
    console.log("deletePerson", { ev, id, purchases });
    purchases = purchases.filter((p) => p.id !== +id);
    doSplit();
    populatePurchaseList();
    populatePersonList();
    populateFinalPaymentsList();
}

/* DOM */
function populatePurchaseList() {
    purchaseList.innerHTML = "";

    purchases.forEach((purchase) => {
        const li = document.createElement("li");
        li.value = purchase.id;
        li.textContent = `${purchase.id} - ${purchase.item} R$${purchase.price}`;

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

        const br = document.createElement("br");
        li.append(btn, br, innerUl);
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
    purchaseParticipantsList.innerHTML = "";

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
        purchaseParticipantsList.append(div);
    });
}

function populatePersonList() {
    personList.innerHTML = "";

    persons.forEach((person) => {
        const li = document.createElement("li");
        li.value = person.id;
        // li.textContent = `${person.name} ID: ${person.id} `;

        const nameDiv = document.createElement("div");
        nameDiv.textContent = `${person.name} ID: ${person.id}`;

        const balanceDiv = document.createElement("balance");
        balanceDiv.textContent = `balance: R$${getPersonBalance(person).toFixed(2)}`;

        const btnDiv = document.createElement("div");
        const btn = document.createElement("button");
        btn.dataset.personId = person.id;
        btn.textContent = "❌";
        btn.addEventListener("click", deletePerson);
        btnDiv.append(btn);

        li.append(nameDiv, balanceDiv, btnDiv);
        personList.append(li);
    });
}

function populateFinalPaymentsList() {
    finalPaymentsList.innerHTML = "";

    if (finalPayments.length == 0) {
        const li = document.createElement("li");
        li.textContent = "All Good! No one has to pay anyone";
        finalPaymentsList.append(li);
        return;
    }

    finalPayments.forEach((payment) => {
        const { debtor, creditor, value } = payment;
        const [debtorName, debtorId] = debtor.split("-");
        const [creditorName, creditorId] = creditor.split("-");

        const li = document.createElement("li");

        li.textContent = `${debtorName} pays R$${value.toFixed(2)} to ${creditorName}`;
        finalPaymentsList.append(li);
    });
}

/* localStorage */
function syncData() {
    localStorage.setItem("persons", JSON.stringify(persons));
    localStorage.setItem("purchases", JSON.stringify(purchases));
    localStorage.setItem("finalPayments", JSON.stringify(finalPayments));
}

function loadStoredData() {
    persons = JSON.parse(localStorage.getItem("persons")) || [];
    purchases = JSON.parse(localStorage.getItem("purchases")) || [];
    finalPayments = JSON.parse(localStorage.getItem("finalPayments")) || [];
    populatePersonList();
    populateParticipantsList();
    populateBuyerSelect();
    populatePurchaseList();
    populateFinalPaymentsList();
}

/* initialization */
function appendListeners() {
    personAddBtn.addEventListener("click", addPerson);
    purchaseAddBtn.addEventListener("click", addPurchase);
}

function main() {
    loadStoredData();
    appendListeners();
}

main();
