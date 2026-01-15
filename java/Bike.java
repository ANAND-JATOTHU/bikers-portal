package com.bikersportal.model;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Bike entity for Java-based microservices
 * This class represents the Bike model that can be used for future
 * microservices integration with the Bikers Portal platform.
 */
public class Bike implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    private String id;
    private String title;
    private String brand;
    private String model;
    private int year;
    private BigDecimal price;
    private int mileage;
    private int engineCapacity;
    private String description;
    private Condition condition;
    private String color;
    private FuelType fuelType;
    private Category category;
    private Location location;
    private List<String> features;
    private List<String> images;
    private String sellerId;
    private boolean isAvailable;
    private boolean isFeatured;
    private Date createdAt;
    private Date updatedAt;
    private int views;
    
    /**
     * Condition enum representing bike condition
     */
    public enum Condition {
        NEW("New"),
        EXCELLENT("Excellent"),
        GOOD("Good"),
        FAIR("Fair"),
        POOR("Poor");
        
        private final String value;
        
        Condition(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
    }
    
    /**
     * FuelType enum representing bike fuel types
     */
    public enum FuelType {
        PETROL("Petrol"),
        DIESEL("Diesel"),
        ELECTRIC("Electric"),
        HYBRID("Hybrid");
        
        private final String value;
        
        FuelType(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
    }
    
    /**
     * Category enum representing bike categories
     */
    public enum Category {
        SPORT("Sport"),
        CRUISER("Cruiser"),
        TOURING("Touring"),
        OFF_ROAD("Off-road"),
        SCOOTER("Scooter"),
        ELECTRIC("Electric"),
        VINTAGE("Vintage"),
        OTHER("Other");
        
        private final String value;
        
        Category(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
    }
    
    /**
     * Location class representing bike location details
     */
    public static class Location implements Serializable {
        private static final long serialVersionUID = 1L;
        
        private String city;
        private String state;
        private String country;
        
        // Default constructor
        public Location() {
        }
        
        // Parameterized constructor
        public Location(String city, String state, String country) {
            this.city = city;
            this.state = state;
            this.country = country;
        }
        
        // Getters and setters
        public String getCity() {
            return city;
        }
        
        public void setCity(String city) {
            this.city = city;
        }
        
        public String getState() {
            return state;
        }
        
        public void setState(String state) {
            this.state = state;
        }
        
        public String getCountry() {
            return country;
        }
        
        public void setCountry(String country) {
            this.country = country;
        }
        
        @Override
        public String toString() {
            return city + ", " + state + ", " + country;
        }
    }
    
    // Default constructor
    public Bike() {
        this.features = new ArrayList<>();
        this.images = new ArrayList<>();
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
    
    // Getters and setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getBrand() {
        return brand;
    }
    
    public void setBrand(String brand) {
        this.brand = brand;
    }
    
    public String getModel() {
        return model;
    }
    
    public void setModel(String model) {
        this.model = model;
    }
    
    public int getYear() {
        return year;
    }
    
    public void setYear(int year) {
        this.year = year;
    }
    
    public BigDecimal getPrice() {
        return price;
    }
    
    public void setPrice(BigDecimal price) {
        this.price = price;
    }
    
    public int getMileage() {
        return mileage;
    }
    
    public void setMileage(int mileage) {
        this.mileage = mileage;
    }
    
    public int getEngineCapacity() {
        return engineCapacity;
    }
    
    public void setEngineCapacity(int engineCapacity) {
        this.engineCapacity = engineCapacity;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Condition getCondition() {
        return condition;
    }
    
    public void setCondition(Condition condition) {
        this.condition = condition;
    }
    
    public String getColor() {
        return color;
    }
    
    public void setColor(String color) {
        this.color = color;
    }
    
    public FuelType getFuelType() {
        return fuelType;
    }
    
    public void setFuelType(FuelType fuelType) {
        this.fuelType = fuelType;
    }
    
    public Category getCategory() {
        return category;
    }
    
    public void setCategory(Category category) {
        this.category = category;
    }
    
    public Location getLocation() {
        return location;
    }
    
    public void setLocation(Location location) {
        this.location = location;
    }
    
    public List<String> getFeatures() {
        return features;
    }
    
    public void setFeatures(List<String> features) {
        this.features = features;
    }
    
    public void addFeature(String feature) {
        this.features.add(feature);
    }
    
    public List<String> getImages() {
        return images;
    }
    
    public void setImages(List<String> images) {
        this.images = images;
    }
    
    public void addImage(String imageUrl) {
        this.images.add(imageUrl);
    }
    
    public String getSellerId() {
        return sellerId;
    }
    
    public void setSellerId(String sellerId) {
        this.sellerId = sellerId;
    }
    
    public boolean isAvailable() {
        return isAvailable;
    }
    
    public void setAvailable(boolean available) {
        isAvailable = available;
    }
    
    public boolean isFeatured() {
        return isFeatured;
    }
    
    public void setFeatured(boolean featured) {
        isFeatured = featured;
    }
    
    public Date getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
    
    public Date getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public int getViews() {
        return views;
    }
    
    public void setViews(int views) {
        this.views = views;
    }
    
    @Override
    public String toString() {
        return "Bike{" +
                "id='" + id + '\'' +
                ", title='" + title + '\'' +
                ", brand='" + brand + '\'' +
                ", model='" + model + '\'' +
                ", year=" + year +
                ", price=" + price +
                ", condition=" + condition +
                ", category=" + category +
                '}';
    }
} 