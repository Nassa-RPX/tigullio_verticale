window.addEventListener('load', () => {
  // FORM SUBMISSION
  const form = document.getElementById("newsletter-form");

  if (form) {
    showCurrentStatus('idle');
    form.addEventListener("submit", onFormSubmit);

    function onFormSubmit(event: SubmitEvent) {
      showCurrentStatus('loading');
      if (!event.target) return;
      event.preventDefault();
      const data = new FormData(event.currentTarget as HTMLFormElement);
      const dataObject = Object.fromEntries(data.entries()) as { email: string; name: string };
      console.log(dataObject);

      fetch("https://api.kit.com/v4/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Kit-Api-Key": import.meta.env.PUBLIC_KIT_API,
        },
        body: JSON.stringify({
          first_name: dataObject.name,
          email_address: dataObject.email,
        })
      }).then(response => {
        console.log(response);
        if (response.ok) {
          window.location.href = '/newsletter-success';
        }
      }).catch(error => {
        console.error("Error:", error);
      }).finally(() => {
        showCurrentStatus('idle');
      })
    }
  }

  function showCurrentStatus(currentStatus: 'idle' | 'loading') {
    const btns = {
      idle: document.getElementById('btn-idle'),
      loading: document.getElementById('btn-loading'),
    }


    Object.entries(btns).forEach(([key, btn]) => {
      if (key === currentStatus) {
        btn?.classList.remove('hidden');
      } else {
        btn?.classList.remove('hidden');
        btn?.classList.add('hidden');
      }
    })

  }
})
