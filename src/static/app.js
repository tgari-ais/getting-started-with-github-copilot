document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.length = 1;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("article");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const title = document.createElement("h4");
        title.textContent = name;
        activityCard.appendChild(title);

        const description = document.createElement("p");
        description.textContent = details.description;
        activityCard.appendChild(description);

        function addDetail(label, value) {
          const detail = document.createElement("p");
          const labelElement = document.createElement("strong");
          labelElement.textContent = `${label}: `;
          detail.append(labelElement, value);
          activityCard.appendChild(detail);
        }

        addDetail("Schedule", details.schedule);
        addDetail("Availability", `${spotsLeft} spots left`);

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        participantsSection.appendChild(participantsHeading);

        if (details.participants.length > 0) {
          const participantsList = document.createElement("ul");
          participantsList.className = "participants-list";

          details.participants.forEach((participant) => {
            const listItem = document.createElement("li");
            const participantEmail = document.createElement("span");
            participantEmail.className = "participant-email";
            participantEmail.textContent = participant;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "remove-participant-button";
            removeButton.setAttribute("aria-label", `Unregister ${participant} from ${name}`);

            const deleteIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            deleteIcon.setAttribute("viewBox", "0 0 24 24");
            deleteIcon.setAttribute("aria-hidden", "true");
            const deletePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            deletePath.setAttribute("d", "M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6");
            deleteIcon.appendChild(deletePath);
            removeButton.appendChild(deleteIcon);

            removeButton.addEventListener("click", async () => {
              removeButton.disabled = true;

              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(participant)}`,
                  { method: "DELETE" }
                );
                const result = await response.json();

                if (!response.ok) {
                  removeButton.disabled = false;
                  showMessage(result.detail || "Unable to unregister participant", "error");
                  return;
                }

                await fetchActivities();
                showMessage(result.message, "success");
              } catch (error) {
                removeButton.disabled = false;
                showMessage("Failed to unregister participant. Please try again.", "error");
                console.error("Error unregistering participant:", error);
              }
            });

            listItem.append(participantEmail, removeButton);
            participantsList.appendChild(listItem);
          });

          participantsSection.appendChild(participantsList);
        } else {
          const emptyMessage = document.createElement("p");
          emptyMessage.className = "no-participants";
          emptyMessage.textContent = "No participants yet";
          participantsSection.appendChild(emptyMessage);
        }

        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        signupForm.reset();
        await fetchActivities();
        showMessage(result.message, "success");
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
