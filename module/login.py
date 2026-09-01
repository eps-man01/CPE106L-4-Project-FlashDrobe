import tkinter as tk
from tkinter import messagebox

class MinimalistWardrobe:
    def __init__(self, root):
        self.root = root
        self.root.title("Oak Archive - Login")
        self.root.geometry("400x600")
        self.root.resizable(False, False)

        # Colors
        self.color_main = "#DDCBB7"  # Main Oak
        self.color_sec = "#7B4B36"   # Dark Grain / Detail
        self.color_input = "#E9DEC1" # Lighter wood for input

        self.root.configure(bg=self.color_main)
        self.setup_ui()

    def setup_ui(self):
        # Canvas for the wardrobe structure
        self.canvas = tk.Canvas(self.root, bg=self.color_main, highlightthickness=0)
        self.canvas.place(relwidth=1, relheight=1)

        # 1. Subtle Wood Grain Lines (Decorative)
        for i in range(0, 600, 40):
            self.canvas.create_line(0, i, 400, i + 5, fill="#D6C4AD", width=1)

        # 2. Central Door Seam
        self.canvas.create_line(200, 0, 200, 600, fill=self.color_sec, width=1)

        # 3. Header
        tk.Label(
            self.root, 
            text="W A R D R O B E", 
            font=("Helvetica", 22, "bold"), 
            bg=self.color_main, 
            fg=self.color_sec
        ).pack(pady=(80, 5))
        
        tk.Label(
            self.root, 
            text="MINIMALIST DIGITAL STORAGE", 
            font=("Arial", 8, "bold"),
            bg=self.color_sec, 
            fg=self.color_main
        ).pack(pady=(0, 40))

        # 4. Input Area
        # Username
        self.create_label("OPERATOR NAME")
        self.user_entry = self.create_entry()
        
        # Spacer
        tk.Frame(self.root, bg=self.color_main, height=20).pack()

        # Password
        self.create_label("SECURITY CODE")
        self.pass_entry = self.create_entry(show="*")

        # 5. Buttons (Designed to look like cabinet door handles)
        btn_frame = tk.Frame(self.root, bg=self.color_main)
        btn_frame.pack(pady=60)

        # Login Button (The "Handle")
        login_btn = tk.Button(
            btn_frame, 
            text="LOGIN", 
            command=self.login_action,
            bg=self.color_sec, 
            fg=self.color_main,
            activebackground="#8B5A46",
            activeforeground=self.color_main,
            font=("Arial", 10, "bold"),
            relief="flat",
            width=15,
            height=2,
            cursor="hand2"
        )
        login_btn.pack(pady=5)

        # Register Button (Minimalist text link)
        reg_btn = tk.Button(
            btn_frame, 
            text="Create New Account", 
            command=self.register_action,
            bg=self.color_main, 
            fg=self.color_sec,
            activebackground=self.color_main,
            activeforeground=self.color_sec,
            font=("Arial", 9),
            relief="flat",
            borderwidth=0,
            cursor="hand2"
        )
        reg_btn.pack(pady=10)

        # Footer
        tk.Label(
            self.root, 
            text="COLLECTION V.1.0", 
            font=("Arial", 7), 
            bg=self.color_main, 
            fg=self.color_sec
        ).place(relx=0.5, rely=0.95, anchor="center")

    def create_label(self, text):
        lbl = tk.Label(
            self.root, 
            text=text, 
            font=("Arial", 8, "bold"), 
            bg=self.color_main, 
            fg=self.color_sec
        )
        lbl.pack(anchor="w", padx=65)

    def create_entry(self, show=""):
        # Entry container for a clean minimalist border
        frame = tk.Frame(self.root, bg=self.color_sec, pady=1) 
        frame.pack(padx=60, fill="x")
        
        entry = tk.Entry(
            frame, 
            bg=self.color_input, 
            fg=self.color_sec,
            insertbackground=self.color_sec,
            font=("Arial", 12),
            relief="flat",
            show=show,
            borderwidth=5 # Acts as internal padding
        )
        entry.pack(fill="x")
        return entry

    def login_action(self):
        name = self.user_entry.get()
        if name:
            messagebox.showinfo("WARDROBE", f"Identity Confirmed.\nOpening drawer for {name}...")
        else:
            messagebox.showwarning("WARDROBE", "Please provide a name.")

    def register_action(self):
        messagebox.showinfo("WARDROBE", "Protocol initiated: Preparing new oak slot.")

if __name__ == "__main__":
    root = tk.Tk()
    app = MinimalistWardrobe(root)
    root.mainloop()