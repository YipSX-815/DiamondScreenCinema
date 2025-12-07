using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion.Internal;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DiamondScreenCinema.Models;

public class DB : DbContext
{
    public DB(DbContextOptions options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Cinema_Promotion>()
            .HasKey(cp => new { cp.CinemaId, cp.PromotionId });

        modelBuilder.Entity<Cinema_Product>()
            .HasKey(cp => new { cp.CinemaId, cp.ProductId });

        modelBuilder.Entity<Booking_Product>()
            .HasKey(bp => new { bp.BookingId, bp.ProductId });

        modelBuilder.Entity<Booking_Seat>()
            .HasKey(bs => new { bs.BookingId, bs.SeatId });

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.User)
            .WithMany(u => u.Bookings)
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.Showtime)
            .WithMany()
            .HasForeignKey(b => b.ShowtimeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Booking_Seat>()
            .HasOne(bs => bs.Booking)
            .WithMany(b => b.BookingSeats)
            .HasForeignKey(bs => bs.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Booking_Seat>()
            .HasOne(bs => bs.Seat)
            .WithMany(s => s.BookingSeats)
            .HasForeignKey(bs => bs.SeatId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Booking_Product>()
            .HasOne(bp => bp.Booking)
            .WithMany(b => b.BookingProducts)
            .HasForeignKey(bp => bp.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Booking_Product>()
            .HasOne(bp => bp.Product)
            .WithMany(p => p.Bookings_Products)
            .HasForeignKey(bp => bp.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Seat>()
            .HasOne(s => s.Hall)
            .WithMany(h => h.Seats)
            .HasForeignKey(s => s.HallId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Showtime>()
            .HasOne(s => s.Movie)
            .WithMany(m => m.Showtimes)
            .HasForeignKey(s => s.MovieId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Showtime>()
            .HasOne(s => s.Hall)
            .WithMany(h => h.Showtimes)
            .HasForeignKey(s => s.HallId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.Movie)
            .WithMany(m => m.Reviews)
            .HasForeignKey(r => r.MovieId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.Booking)
            .WithOne(b => b.Payment)
            .HasForeignKey<Payment>(p => p.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Payment>()
            .HasIndex(p => p.BookingId)
            .IsUnique();

        modelBuilder.Entity<Cinema_Product>()
            .HasOne(cp => cp.Cinema)
            .WithMany()
            .HasForeignKey(cp => cp.CinemaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Cinema_Product>()
            .HasOne(cp => cp.Product)
            .WithMany(p => p.Cinemas_Products)
            .HasForeignKey(cp => cp.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Cinema_Promotion>()
            .HasOne(cp => cp.Cinema)
            .WithMany()
            .HasForeignKey(cp => cp.CinemaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Cinema_Promotion>()
            .HasOne(cp => cp.Promotion)
            .WithMany(p => p.Cinemas_Promotions)
            .HasForeignKey(cp => cp.PromotionId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Customer>()
            .HasMany(c => c.Favorites)
            .WithMany(p => p.FavouriteBy)
            .UsingEntity(j => j.ToTable("Customer_Favorites"));
    }

    // DBSets
    public DbSet<Cinema> Cinemas { get; set; }
        public DbSet<Hall> Halls { get; set; }
        public DbSet<Showtime> Showtimes { get; set; }
        public DbSet<Movie> Movies { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Seat> Seats { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Booking_Product> Bookings_Products { get; set; }
        public DbSet<Booking_Seat> Bookings_Seats { get; set; }
        public DbSet<Cinema_Product> Cinemas_Products { get; set; }
        public DbSet<Promotion> Promotions { get; set; }
        public DbSet<Cinema_Promotion> Cinemas_Promotions { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Staff> Staff { get; set; }
        public DbSet<Admin> Admins { get; set; }
}

// Entity Classes

#nullable disable warnings

public class Cinema
{
    [Key]
    public string CinemaId { get; set; }
    public string Name { get; set; }
    public string Address { get; set; }
    public string ContactNumber { get; set; }
    public string LocationCity { get; set; }
    public string LocationState { get; set; }
    [MaxLength(500)]
    public string CinemaImage { get; set; }
}

public class Hall
{
    [Key]
    public string HallId { get; set; }
    public string Name { get; set; }
    public string Type { get; set; }
    public bool Status { get; set; }

    // Foreign Key
    public string CinemaId { get; set; }
    [ForeignKey("CinemaId")]
    public Cinema Cinema { get; set; }

    public List<Seat> Seats { get; set; } = [];
    public List<Showtime> Showtimes { get; set; } = [];
}

public class Showtime
{
    [Key]
    public string ShowtimeId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public DateTime ShowDate { get; set; }

    // Foreign Key
    public string MovieId{ get; set; }
    [ForeignKey("MovieId")]
    public Movie Movie { get; set; }

    public string HallId { get; set; }
    [ForeignKey("HallId")]
    public Hall Hall { get; set; }
}

public class Movie
{
    [Key]
    public string MovieId { get; set; }
    public string Title { get; set; }
    public string Poster { get; set; }
    public string HorizontalPoster { get; set; } 
    public string Trailer { get; set; }
    public int Duration { get; set; }
    public string Language { get; set; }
    public string Director { get; set; }
    public string Cast { get; set; }
    public string? Synopsis { get; set; }
    public string Classification { get; set; }
    public string Status { get; set; }
    public string Subtitle { get; set; }
    public string Genre { get; set; }
    public DateTime ReleaseDate { get; set; }

    public List<Showtime> Showtimes { get; set; } = [];
    public List<Review> Reviews { get; set; } = [];
}

public class Seat
{
    [Key]
    public string SeatId { get; set; }
    public string Row { get; set; }
    public int Number { get; set; }
    public string Type { get; set; }
    [Precision(4,2)]
    public double Price { get; set; }
    public bool Status { get; set; }

    // Foreign Key
    public string HallId { get; set; }
    [ForeignKey("HallId")]
    public Hall Hall { get; set; }

    public List<Booking_Seat> BookingSeats { get; set; } = [];
}

public class Cinema_Promotion
{
    // Foreign Key
    public string CinemaId { get; set; }
    [ForeignKey("CinemaId")]
    public Cinema Cinema { get; set; }

    public string PromotionId { get; set; }
    [ForeignKey("PromotionId")]
    public Promotion Promotion { get; set; }
}

public class Promotion
{
    [Key]
    public string PromotionId { get; set; }
    public string PromoCode { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public string Poster { get; set; }
    public string Type { get; set; }
    public int? Percentage { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int? RedeemLimit { get; set; }
    public int? RedeemPoint { get; set; }

    public List<Cinema_Promotion> Cinemas_Promotions { get; set; } = [];
}

public class Cinema_Product
{
    public int Stock { get; set; }

    // Foreign Key
    public string CinemaId { get; set; }
    [ForeignKey("CinemaId")]
    public Cinema Cinema { get; set; }

    public string ProductId { get; set; }
    [ForeignKey("ProductId")]
    public Product Product { get; set; }
}

public class Product
{
    [Key]
    public string ProductId { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    [Precision(5,2)]
    public double Price { get; set; }

    public List<Cinema_Product> Cinemas_Products { get; set; } = [];
    public List<Booking_Product> Bookings_Products { get; set; } = [];
    public List<Customer> FavouriteBy { get; set; } = [];

}

public class Booking
{
    [Key]
    public string BookingId { get; set; }
    public DateTime Date { get; set; }

    // Foreign Key
    public string UserId { get; set; }
    [ForeignKey("UserId")]
    public User User { get; set; }

    public string ShowtimeId { get; set; }
    [ForeignKey("ShowtimeId")]
    public Showtime Showtime { get; set; }

    public List<Booking_Seat> BookingSeats { get; set; } = [];
    public List<Booking_Product> BookingProducts { get; set; } = [];
    public Payment Payment { get; set; }
}

public class Booking_Product
{
    public int Quantity { get; set; }

    // Foreign Key
    public string BookingId { get; set; }
    [ForeignKey("BookingId")]
    public Booking Booking { get; set; }

    public string ProductId { get; set; }
    [ForeignKey("ProductId")]
    public Product Product { get; set; }
}

public class Review
{
    [Key]
    public string ReviewId { get; set; }
    public int Rating { get; set; }
    [MaxLength(500)]
    public string Comment { get; set; }

    // Foreign Key
    public string UserId { get; set; }
    [ForeignKey("UserId")]
    public User User { get; set; }

    public string MovieId { get; set; }
    [ForeignKey("MovieId")]
    public Movie Movie { get; set; }
}

public class Payment
{
    [Key]
    public string PaymentId { get; set; }
    [Precision(7,2)]
    public double Amount { get; set; }
    public string Method { get; set; }
    public string Status { get; set; }
    public DateTime Date { get; set; }

    // Foreign Key
    public string BookingId { get; set; }
    [ForeignKey("BookingId")]
    public Booking Booking { get; set; }
}

public class User
{
    [Key]
    public string UserId { get; set; }
    public string Username { get; set; }
    public string Password { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string Gender { get; set; }
    public string? ProfileImage { get; set; }
    public string AccountStatus { get; set; }
    public List<string>? SecurityQuestions { get; set; }
    public List<string>? SecurityAnswer { get; set; }

    public string Role => GetType().Name;

    public List<Booking> Bookings { get; set; } = [];
}

public class Booking_Seat
{
    // Foreign Key
    public string SeatId { get; set; }
    [ForeignKey("SeatId")]
    public Seat Seat { get; set; }

    public string BookingId { get; set; }
    [ForeignKey("BookingId")]
    public Booking Booking { get; set; }
}

public class Customer : User
{
    public int Point { get; set; }
    public string MembershipTier { get; set; }
    public DateTime DateOfBirth { get; set; }

    public List<Product> Favorites { get; set; } = [];
}

public class Staff : User
{
    // Foreign Key
    public string CinemaId { get; set; }
    [ForeignKey("CinemaId")]
    public Cinema Cinema { get; set; }
}

public class Admin : User
{
    public string Position { get; set; }
}