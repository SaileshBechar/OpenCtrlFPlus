import openai
from keys import openai_key
import math
import time

openai.api_key = openai_key

RUN_TESTS = False
N_RETRIES = 3
TEST_PAGE_LLMS_MIRAGE = """Emergent abilities of large language models are creations of the researcher’s analyses,
not fundamental changes in model outputs with scale. (A) Suppose the per-token cross-entropy
loss decreases monotonically with model scale, e.g., LCE scales as a power law. (B) The per-token
probability of selecting the correct token asymptotes towards 1 with increasing model scale. (C) If
the researcher scores models’ outputs using a nonlinear metric such as Accuracy (which requires a
sequence of tokens to all be correct), the researcher’s measurement choice nonlinearly scales performance, causing performance to change sharply and unpredictably in a manner that qualitatively
matches published emergent abilities (inset). (D) If the researcher instead scores models’ outputs
using a discontinuous metric such as (Multiple Choice Grade, which is similar to a step function),
the researcher’s measurement choice discontinuously scales performance, causing performance to
change sharply and unpredictably in a manner that qualitatively matches published emergent abilities
(inset). (E) Changing from a nonlinear metric to a linear metric (such as Token Edit Distance), model
shows smooth, continuous and predictable improvements, ablating the emergent ability. (F) Changing from a discontinuous metric to a continuous metric (e.g. Brier Score) again reveals smooth,
continuous and predictable improvements in task performance, ablating the emergent ability. Consequently, emergent abilities may be creations of the researcher’s analyses, not fundamental changes
in model family behavior on specific tasks."""
TEST_PAGE_EMC_PAGE7 = """of the deuteron. Hence Eq. [ 6 expresses the fact that in the region $j<x<j+1$ the contribution of $j$-nucleon SRCs dominates. This result is in reasonable agreement with numerical calculations of the nuclear spectral functions [66, 67].

![](https://cdn.mathpix.com/cropped/2023_05_10_ff44f8676e0c694742d2g-07.jpg?height=526&width=740&top_left_y=412&top_left_x=237)

FIG. 6: (color online) Per nucleon cross section ratios for ${ }^{3} \mathrm{He} /{ }^{2} \mathrm{H}$ and ${ }^{12} \mathrm{C} /{ }^{2} \mathrm{H}$ measured at JLab [9] at $18^{\circ}$. In the region dominated by $2 \mathrm{~N}$ SRCs the ratios becomes independent of $x$. The dip around $x=1$ is the result of $A>2$ nuclei having wider quasielastic peaks and the solid line indicates the region used to extract the ratio $a_{2}$.

Equation (6) suggests scaling relations between scattering off the heavy nuclei and the deuteron:

$$\frac{\sigma_{A}\left(x, Q^{2}\right) / A}{\sigma_{D}\left(x, Q^{2}\right) / 2}=\left.a_{2}(A)\right|_{1.4 \leq x \leq 2}$$

The scaling of the cross section ratios has been established, first at SLAC [2] and at Jefferson Lab [5, 6, 9]. The most recent experiment measured this scaling precisely in the $2 \mathrm{~N}$ correlation region for a range of nuclei with selected data shown in Fig. [6.

In extracting the relative contributions of $2 \mathrm{~N}$ SRCs in the inclusive cross section ratios at $x>1$, it has typically been assumed that the electron is scattering from a pair of 
nucleons with large relative momentum but zero total momentum, such that the cross section for scattering from a neutron-proton pair in a nucleus is identical to the cross section for scattering from a deuteron. In this case, the elementary electron-nucleon cross sections as well as any off-shell effects cancel in taking the ratio. Final state interactions are also assumed to cancel in the cross section ratios [2, 11].

Earlier analyses [2, 5, 6] assumed that the SRCs would be isospin-independent, with equal probability for $p p, n p$, and $n n$ pairs to have hard interactions and generate highmomentum nucleons. This necessitated an "isoscalar correction" to account for the excess of $n n$ (or $p p$ ) pairs in non-isoscalar nuclei as well as the difference between the $e-p$ and $e-n$ elastic cross sections. More recently, measurements of two-nucleon knockout showed that these correlations are dominated by $n p$ pairs [8, 68] due to the fact that the bulk of the high-momentum nucleons are generated via the tensor part of the $\mathrm{N}-\mathrm{N}$ interaction rather than the short-range repulsive core $[69,70]$. The most recent experiment $[9]$ to precisely measure 
SRCs on a range of nuclei did not apply this isoscalar correction, and presented results for previous measurements with this correction removed.

The per nucleon cross section ratio at large $x$ provides a direct measure of the contribution of high-momentum nucleons relative to the deuteron. However, this is not equal to the relative 
number of SRCs, since in $A>2$ nuclei, the correlated pair experiences motion in the mean field created by the rest of the nucleons. The momentum distribution of the pair will be smeared out, which will flatten the top of the QE peak, depleting the lowmomentum part of the distribution, but enhancing the high-momentum tail. The effect is illustrated in Fig. 7 which shows the deuteron momentum distribution along with an estimate of the momentum distribution for an $n p$ pair in iron. The "smeared deuteron" curve is generated by taking the high-momentum part of the deuteron distribution and convolving it with a pair c.m. distribution to estimate the impact of the motion of the correlated pair in the nucleus. This is combined with a gaussian distribution whose width is chosen to reproduce a mean field calculation for iron [67], and whose magnitude is such that the total distribution is properly normalized.

![](https://cdn.mathpix.com/cropped/2023_05_10_ff44f8676e0c694742d2g-07.jpg?height=493&width=721&top_left_y=1309&top_left_x=1184)

FIG. 7: (color online) Momentum distribution for the free deuteron and an $n p$ pair in iron, taken as the sum of a mean field (gaussian) contribution and the convolution of the highmomentum deuteron tail with the c.m. motion of the pair in iron.

A correction for this redistribution of strength was first applied in Ref. [9], where analyses of previous experiments were also updated. The correction procedure was based on the calculation of Ref. [67], where the deuteron momentum distribution was convolved with a parametrization of c.m. motion of the pair, which yielded a $20 \%$ enhancement in the high momentum tail for iron. This correction was applied to the other nuclei by assuming that the enhancement in the ratio, which scales with the c.m. momentum of the pair, was proportional to the Fermi motion of the nucleus."""

def unit_test_LLMs_mirage(summary):
    facts = [
        """Emergent abilities may stem from researcher analyses, not model output changes.""",
        """Cross-entropy loss decreases with model scale (A).""",
        """Correct token probability nears 1 as scale increases (B).""",
        """Nonlinear metrics cause unpredictable performance shifts, resembling emergent abilities (C).""",
        """Discontinuous metrics cause performance shifts (D).""",
        """Linear metrics (e.g., Token Edit Distance) show continuous improvements, negating emergent abilities (E).""",
        """Continuous metrics (e.g., Brier Score) yield similar improvements, negating emergent abilities (F).""",
    ]
    return unit_test_summarize(summary, facts)

def unit_test_EMC_page7(summary):
    facts = [
        """![](https://cdn.mathpix.com/cropped/2023_05_10_ff44f8676e0c694742d2g-07.jpg?height=526&width=740&top_left_y=412&top_left_x=237)""",
        """in the region $j<x<j+1$ the contribution of $j$-nucleon SRCs dominates""",
        """Per nucleon cross section ratios for ${ }^{3} \mathrm{He} /{ }^{2} \mathrm{H}$ and ${ }^{12} \mathrm{C} /{ }^{2} \mathrm{H}$ measured at JLab [9] at $18^{\circ}$""",
        """In the region dominated by $2 \mathrm{~N}$ SRCs the ratios becomes independent of $x$.""",
        """The dip around $x=1$ is the result of $A>2$ nuclei having wider quasielastic peaks and the solid line indicates the region used to extract the ratio $a_{2}$.""",
        """$$\frac{\sigma_{A}\left(x, Q^{2}\right) / A}{\sigma_{D}\left(x, Q^{2}\right) / 2}=\left.a_{2}(A)\right|_{1.4 \leq x \leq 2}$$""",
        """![](https://cdn.mathpix.com/cropped/2023_05_10_ff44f8676e0c694742d2g-07.jpg?height=493&width=721&top_left_y=1309&top_left_x=1184)"""
    ]
    return unit_test_summarize(summary, facts)

def unit_test_summarize(summary, facts):
    # core facts that summary must contain
    for i, fact in enumerate(facts):
        time.sleep(1/2000)
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": f"Return True if the fact is in the article. If the fact is not in the article, return False. A fact could be text, an equation, or a figure.\nArticle: ```{summary}```\nFact: ```{fact}```"}],
            temperature = 0.0
        )
        response_text = response.choices[0].message.content
        if 'true' not in response_text.lower():
            print(f"❌ Failed on: fact {fact} in summary {summary} (GPT output: {response_text})")
            return False
    print(f"✅ Summary passed all {len(facts)} unit tests")
    return True

def estimate_token_count(text): 
    return len(text)/4

def summarize_chunk_of_text(page):
    summarize_prompt = """Please concisely rewrite, while preserving the important details, all the text in the article in the following mathpix markdown."""
    if '$' in page:
        summarize_prompt += """ Give the full markdown (with equations in $ or $$ tags) for each equation in the article."""
    if '![](' in page:
        summarize_prompt += """ Give the full markdown (with the mathpix image link in ![]() notation) for each figure in the article."""
    time.sleep(1/2000)
    retry = True
    for i in range(N_RETRIES):
        try:
            response = openai.ChatCompletion.create(
                        model="gpt-3.5-turbo",
                        messages=[{"role": "system", "content": summarize_prompt + f"\nArticle: ```{page}```"}],
                        temperature = 0.0
                )
            break
        except:
            time.sleep(1)
            continue
    summary = response.choices[0].message.content
    return summary

def summarize_large_text(text, token_limit = 4000):
    text_length = len(text)
    estimated_tokens = estimate_token_count(text)
    if estimated_tokens <= token_limit:
        return summarize_chunk_of_text(text)
    chunk_size = int(token_limit * 4)
    summary = ""
    for i in range(0, text_length, chunk_size):
        chunk = text[i:i + chunk_size]
        chunk_summary = summarize_chunk_of_text(chunk)
        summary += chunk_summary
    return summary

if RUN_TESTS:
    tests = [(unit_test_EMC_page7, TEST_PAGE_EMC_PAGE7), (unit_test_LLMs_mirage, TEST_PAGE_LLMS_MIRAGE)]
    for test, page in tests:
        test_summary = summarize_large_text(page)    
        print('summarized text', test_summary)
        print('original text (tokens):', page_tokens := estimate_token_count(page)) # upper bound
        print('summary length (tokens):', summary_tokens := estimate_token_count(test_summary)) # goldilocks zone?
        print(r'% of original token count:', summary_tokens/page_tokens)
        if not test(test_summary):
            print("❌ failed")
            exit()
    print("✅ passed everything")
