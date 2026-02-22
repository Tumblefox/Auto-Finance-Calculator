const sections = [
  "personal-section",
  "purchase-section",
  "fuel-section",
  "insurance-section",
  "maintenance-section",
  "cost-breakdown"
];
let sectionIndex = 0;

function initializeStepper() {
  const stepperButtons = document.querySelectorAll("#progress-stepper button");
  const nextButton = document.querySelector("#stepper-next");
  const previousButton = document.querySelector("#stepper-previous");

  stepperButtons.forEach(stepperButton => {
    stepperButton.addEventListener("click", () => {
      let id = stepperButton.getAttribute("data-target");
      specifyStep(id);
    });
  });

  nextButton.addEventListener("click", nextStep);
  previousButton.addEventListener("click", previousStep);
}

function nextStep() {
  if(sectionIndex < sections.length - 1) {
    let currentSection = document.querySelector(`#${sections[sectionIndex]}`);
    let nextSection = document.querySelector(`#${sections[sectionIndex + 1]}`);
    sectionIndex++;
    sectionTransition(currentSection, nextSection);
  }
}

function previousStep() {
  if(sectionIndex > 0) {
    let currentSection = document.querySelector(`#${sections[sectionIndex]}`);
    let previousSection = document.querySelector(`#${sections[sectionIndex - 1]}`);
    sectionIndex--;
    sectionTransition(currentSection, previousSection);
  }
}

function specifyStep(id) {
  let specifiedIndex = sections.indexOf(id);
  let currentSection = document.querySelector(`#${sections[sectionIndex]}`);
  let specifiedSection = document.querySelector(`#${id}`);
  sectionIndex = specifiedIndex;
  sectionTransition(currentSection, specifiedSection);
}

function setActiveButton() {
  const activeButton = document.querySelector(
    "#progress-stepper button.active-step"
  );
  const newActiveButton = document.querySelector(
    `#progress-stepper button[data-target=${sections[sectionIndex]}]`
  );
  activeButton.classList.remove("active-step");
  newActiveButton.classList.add("active-step");
}

function sectionTransition(previous, next) {
  previous.classList.add("hidden");
  next.classList.remove("hidden");
  setActiveButton();
}

export {
  initializeStepper,
  nextStep,
  previousStep,
  specifyStep
}
