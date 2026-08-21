import { useNavigate } from "react-router-dom";
import { getCurrency } from ".././../services/currency.js";

const plans = [
  {
    id: "free-trial",
    name: "Free Trial",
    price: 0,
    period: "7 days",
    description: "Explore NexusAI and try the core AI features.",
    features: [
      "AI conversations",
      "Image generation",
      "Music generation",
      "Video generation",
      "AI vision",
      "Voice conversations",
    ],
    button: "Start Free Trial",
    popular: false,
  },

  {
    id: "creator",
    name: "Creator",
    price: 60,
    period: "month",
    description: "For creators who want more AI generation.",
    features: [
      "More AI conversations",
      "More image generation",
      "Music generation",
      "Video generation",
      "AI vision",
      "Voice conversations",
    ],
    button: "Choose Creator",
    popular: true,
  },

  {
    id: "pro",
    name: "Pro",
    price: 120,
    period: "month",
    description: "Higher limits for advanced NexusAI users.",
    features: [
      "Higher AI limits",
      "Advanced image generation",
      "Advanced video generation",
      "Music generation",
      "Voice & vision",
      "Creative AI tools",
    ],
    button: "Choose Pro",
    popular: false,
  },
];

function Plans() {
  const navigate = useNavigate();

  /*
    Get the country selected during signup.

    We will replace this with the authenticated
    user from the backend later.
  */
  const country = localStorage.getItem("nexusai_country") || "United States";

  const currency = getCurrency(country);

  function formatPrice(price) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  function selectPlan(plan) {
    console.log("Selected plan:", plan);
    console.log("Country:", country);
    console.log("Currency:", currency.code);

    if (plan.id === "free-trial") {
      navigate("/home");
      return;
    }

    alert(
      `Payment processing for the ${plan.name} plan will be connected to the backend later.`,
    );
  }

  return (
    <main className="plans-page">
      <header className="plans-header">
        <div className="brand">
          <div className="brand-symbol">✦</div>

          <h1>NexusAI</h1>
        </div>

        <h2>Choose your plan</h2>

        <p>Choose the NexusAI experience that fits you.</p>

        <div className="currency-display">
          Prices shown in <strong>{currency.code}</strong>
        </div>
      </header>

      <section className="plans-grid">
        {plans.map((plan) => (
          <article
            className={`plan-card ${plan.popular ? "plan-card-popular" : ""}`}
            key={plan.id}
          >
            {plan.popular && <div className="popular-badge">Most Popular</div>}

            <h3>{plan.name}</h3>

            <div className="plan-price">
              <strong>{formatPrice(plan.price)}</strong>

              <span>/ {plan.period}</span>
            </div>

            <p className="plan-description">{plan.description}</p>

            <ul className="plan-features">
              {plan.features.map((feature) => (
                <li key={feature}>
                  <span>✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className="primary-button full-width"
              onClick={() => selectPlan(plan)}
            >
              {plan.button}
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Plans;
