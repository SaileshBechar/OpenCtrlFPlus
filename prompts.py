# Eventually want to tune akin to Chowdhury et al 2022 https://arxiv.org/pdf/2202.00535.pdf
SYSTEM_CALIBRATION_MESSAGE = """You are an expert scientific assistant. A page is given in triple square brackets. Read the page carefully. After doing so, find the most relevant piece of information for the user's query, and give that exact information from the page. Give the response in LaTeX, with equations and figures if relevant. Be very brief in your response. Assume the reader has a graduate level understanding of the topic.

"""
USER_CALIBRATION_MESSAGE_PREFIX = """Query: """
NEWLINE = """
"""
MMD_FORMATTING_SYSTEM_CALIBRATION_MESSAGE = lambda page: f"""A page is given in triple square brackets: [[[{page}]]]. Please insert two newlines where necessary so that the page is well-organized. Give the reformatted page inside triple square brackets."""
FIX_BAD_OCR_SYSTEM_CALIBRATION_MESSAGE = lambda page: f"""A poorly transcribed page is given in triple square brackets: [[[{page}]]]. Please fix any transcription errors. Return the page inside triple square brackets."""
FIGURE_SWITCHER_CALIBRATION_MESSAGE = lambda page: f"""A page is given in the following triple square brackets: [[[{page}]]]. Return "True" if the page contains a figure caption, or return "False" if the page does not contain a figure caption. Please return only either "True" or "False"."""
MATH_SWITCHER_CALIBRATION_MESSAGE = lambda page: f"""A page is given in the following triple square brackets: [[[{page}]]]. Based on the text, return "True" if the page likely contains equations or tables, or return "False" if the page is not likely to contain any equations or tables. Please return only either "True" or "False"."""
