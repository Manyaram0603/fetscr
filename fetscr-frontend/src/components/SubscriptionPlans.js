import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";   // ⬅ import navigate
import "./plans.css";

const SubscriptionPlans = () => {
  const [customQueries, setCustomQueries] = useState(1);
  const [customResults, setCustomResults] = useState(5);
  const [customPrice, setCustomPrice] = useState("$0");
  const [showMoreSubs, setShowMoreSubs] = useState(false);
  const navigate = useNavigate();   // ⬅ initialize navigate

  useEffect(() => {
    const totalResults = customQueries * customResults;
    const priceINR = totalResults * 3;
    const priceUSD = (priceINR / 83).toFixed(2);
    setCustomPrice(`$${priceUSD}`);
  }, [customQueries, customResults]);

  // --- Choosing Predefined Plans ---
  async function choosePlan(plan) {
    const res = await fetch("/setPlan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.success) {
      alert(`✅ Plan activated: ${plan.toUpperCase()} ($${data.priceUSD})`);
      navigate("/home");   // ⬅ redirect to Home instead of index.html
    } else {
      alert("❌ Failed to set plan");
    }
  }

  // --- Choosing Custom Plan ---
  async function chooseCustomPlan() {
    if (!customQueries || !customResults || customResults > 100) {
      alert("⚠ Please enter valid values (Max results = 100).");
      return;
    }
    const res = await fetch("/setPlan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: "enterprise",
        queries: customQueries,
        results: customResults,
      }),
    });
    const data = await res.json();
    if (data.success) {
      alert(
        `✅ Custom Plan Activated: ${customQueries} queries × ${customResults} results/query.
        Confirmed Price: $${data.priceUSD}`
      );
      navigate("/home");   // ⬅ redirect to Home
    } else {
      alert("❌ Failed to set custom plan");
    }
  }

  return (
    <div className="subscription-container" id="pricing">
      <h1>Choose Your Subscription Plan</h1>
      <div className="plans">
        {/* Free Plan */}
        <div className="plan">
          <h2>Base (Free)</h2>
          <p className="price">Free</p>
          <p>✔ 2 Queries</p>
          <p>✔ 5 Results per Query</p>
          <button onClick={() => choosePlan("free")}>Start Free</button>
        </div>

        {/* Enterprise Plan */}
        <div className="plan">
          <h2>Enterprise</h2>
          <p className="price" id="customPrice">{customPrice}</p>
          <label>Number of Queries</label>
          <input
            type="number"
            min="1"
            max="100"
            value={customQueries}
            onChange={(e) => setCustomQueries(parseInt(e.target.value) || 0)}
          />
          <label>Results per Query (max 100)</label>
          <input
            type="number"
            min="1"
            max="100"
            value={customResults}
            onChange={(e) => setCustomResults(parseInt(e.target.value) || 0)}
          />
          <p>
            <small>💡 Price = $0.04 per data (result)</small>
          </p>
          <button onClick={chooseCustomPlan}>Subscribe</button>
        </div>

        {/* Pro Plan */}
        <div className="plan">
          <h2>Pro Plan</h2>
          <p className="price">Fixed Options</p>
          <div className="sub-options">
            <p>
              <b>Sub1:</b> 30 Queries · 20 Results/query · $21.18
            </p>
            <button onClick={() => choosePlan("sub1")}>Subscribe Sub1</button>

            {!showMoreSubs && (
              <button
                className="click-more-btn"
                onClick={() => setShowMoreSubs(true)}
              >
                Click More
              </button>
            )}

            {showMoreSubs && (
              <>
                <p>
                  <b>Sub2:</b> 30 Queries · 50 Results/query · $52.94
                </p>
                <button onClick={() => choosePlan("sub2")}>Subscribe Sub2</button>

                <p>
                  <b>Sub3:</b> 30 Queries · 25 Results/query · $26.47
                </p>
                <button onClick={() => choosePlan("sub3")}>Subscribe Sub3</button>

                <p>
                  <b>Sub4:</b> 20 Queries · 50 Results/query · $35.29
                </p>
                <button onClick={() => choosePlan("sub4")}>Subscribe Sub4</button>
              </>
            )}
          </div>
        </div>
      </div>

      <button className="back-btn" onClick={() => navigate("/home")}>
        ⬅ Back
      </button>
    </div>
  );
};

export default SubscriptionPlans;
